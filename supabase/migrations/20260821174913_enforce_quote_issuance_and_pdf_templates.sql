-- Make quote issuance an explicit, idempotent operation. Draft saves never
-- consume a number; public.assign_quote_number is the only browser-accessible
-- path that can advance the business counter.

ALTER TABLE public.businesses
  ALTER COLUMN next_quote_number SET DEFAULT 200,
  ADD COLUMN IF NOT EXISTS pdf_template_key text NOT NULL DEFAULT 'standard-v1';

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS pdf_template_key text;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS observaciones text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pdf_template_key text,
  ADD COLUMN IF NOT EXISTS pdf_template_version integer,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz;

-- Preserve every existing folio. Only repair the pointer to the next available
-- number, using 200 as the floor for businesses that have never issued a quote.
UPDATE public.businesses AS business
SET next_quote_number = GREATEST(
  business.next_quote_number,
  COALESCE(
    (
      SELECT MAX(quote.numero) + 1
      FROM public.quotes AS quote
      WHERE quote.user_id = business.user_id
        AND quote.numero IS NOT NULL
    ),
    200
  ),
  200
);

-- Quotes that already have a number are already issued. Freeze their current
-- resolved template without changing their number or commercial data.
UPDATE public.quotes AS quote
SET pdf_template_key = COALESCE(
      quote.pdf_template_key,
      (
        SELECT client.pdf_template_key
        FROM public.clients AS client
        WHERE client.id = quote.client_id
          AND client.user_id = quote.user_id
      ),
      (
        SELECT business.pdf_template_key
        FROM public.businesses AS business
        WHERE business.user_id = quote.user_id
      ),
      'standard-v1'
    ),
    pdf_template_version = COALESCE(quote.pdf_template_version, 1),
    issued_at = COALESCE(quote.issued_at, quote.created_at, now())
WHERE quote.numero IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quotes_user_id_numero_unique
  ON public.quotes (user_id, numero)
  WHERE numero IS NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_issued_quote_immutability()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.numero IS NOT NULL AND NEW.numero IS DISTINCT FROM OLD.numero THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'An issued quote number is immutable';
  END IF;

  IF OLD.issued_at IS NOT NULL AND (
    NEW.issued_at IS DISTINCT FROM OLD.issued_at
    OR NEW.pdf_template_key IS DISTINCT FROM OLD.pdf_template_key
    OR NEW.pdf_template_version IS DISTINCT FROM OLD.pdf_template_version
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'An issued quote template is immutable';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quotes_issued_fields_immutable ON public.quotes;
CREATE TRIGGER quotes_issued_fields_immutable
BEFORE UPDATE OF numero, issued_at, pdf_template_key, pdf_template_version
ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_issued_quote_immutability();

REVOKE ALL ON FUNCTION public.enforce_issued_quote_immutability()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.assign_quote_number(_quote_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requesting_user_id uuid := auth.uid();
  current_number integer;
  assigned_number integer;
  next_number integer;
  quote_client_id uuid;
  quote_template_key text;
  client_template_key text;
  business_template_key text;
BEGIN
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Authentication required';
  END IF;

  -- The row lock makes repeated/concurrent calls for the same quote idempotent.
  SELECT quote.numero, quote.client_id, quote.pdf_template_key
  INTO current_number, quote_client_id, quote_template_key
  FROM public.quotes AS quote
  WHERE quote.id = _quote_id
    AND quote.user_id = requesting_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Quote not found';
  END IF;

  SELECT client.pdf_template_key
  INTO client_template_key
  FROM public.clients AS client
  WHERE client.id = quote_client_id
    AND client.user_id = requesting_user_id;

  IF current_number IS NOT NULL THEN
    UPDATE public.quotes AS quote
    SET pdf_template_key = COALESCE(
          quote.pdf_template_key,
          client_template_key,
          (
            SELECT business.pdf_template_key
            FROM public.businesses AS business
            WHERE business.user_id = requesting_user_id
          ),
          'standard-v1'
        ),
        pdf_template_version = COALESCE(quote.pdf_template_version, 1),
        issued_at = COALESCE(quote.issued_at, now())
    WHERE quote.id = _quote_id
      AND quote.user_id = requesting_user_id;

    RETURN current_number;
  END IF;

  -- A business is normally created by handle_new_user. This keeps issuance
  -- compatible with older accounts that might be missing that row.
  INSERT INTO public.businesses (user_id)
  VALUES (requesting_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- All quotes for the same business serialize on this row lock.
  SELECT business.next_quote_number, business.pdf_template_key
  INTO next_number, business_template_key
  FROM public.businesses AS business
  WHERE business.user_id = requesting_user_id
  FOR UPDATE;

  SELECT GREATEST(
    next_number,
    COALESCE(MAX(quote.numero) + 1, 200),
    200
  )
  INTO assigned_number
  FROM public.quotes AS quote
  WHERE quote.user_id = requesting_user_id;

  UPDATE public.businesses AS business
  SET next_quote_number = assigned_number + 1
  WHERE business.user_id = requesting_user_id;

  UPDATE public.quotes AS quote
  SET numero = assigned_number,
      pdf_template_key = COALESCE(
        quote_template_key,
        client_template_key,
        business_template_key,
        'standard-v1'
      ),
      pdf_template_version = 1,
      issued_at = now()
  WHERE quote.id = _quote_id
    AND quote.user_id = requesting_user_id;

  RETURN assigned_number;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_quote_number(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_quote_number(uuid) TO authenticated;

-- Browser payloads can edit business/quote content, but the database-managed
-- counter, folio and issuance metadata are excluded from their column grants.
REVOKE INSERT, UPDATE ON public.businesses FROM authenticated;
GRANT INSERT (
  id, user_id, nombre, rut, giro, direccion, telefono, email, sitio_web,
  logo_path, banco_nombre, banco_tipo_cuenta, banco_numero_cuenta,
  banco_titular, banco_rut, banco_email, condiciones, pie_pagina,
  iva_percent, color_factura, pdf_template_key
) ON public.businesses TO authenticated;
GRANT UPDATE (
  id, user_id, nombre, rut, giro, direccion, telefono, email, sitio_web,
  logo_path, banco_nombre, banco_tipo_cuenta, banco_numero_cuenta,
  banco_titular, banco_rut, banco_email, condiciones, pie_pagina,
  iva_percent, color_factura, pdf_template_key
) ON public.businesses TO authenticated;

REVOKE INSERT, UPDATE ON public.quotes FROM authenticated;
GRANT INSERT (
  id, user_id, client_id, fecha, validez_dias, estado, atencion, subtotal,
  iva, total, iva_percent, snapshot_negocio, snapshot_cliente,
  observaciones, is_archived, pdf_template_key
) ON public.quotes TO authenticated;
GRANT UPDATE (
  id, user_id, client_id, fecha, validez_dias, estado, atencion, subtotal,
  iva, total, iva_percent, snapshot_negocio, snapshot_cliente,
  observaciones, is_archived, pdf_template_key
) ON public.quotes TO authenticated;
