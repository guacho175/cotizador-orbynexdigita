-- Keep the existing persisted state values for compatibility, while making the
-- lifecycle authoritative in the database. UI labels map enviada/rechazada to
-- Realizada/Pospuesta por el cliente.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS tax_label text NOT NULL DEFAULT 'IVA';

UPDATE public.businesses
SET tax_label = 'IVA'
WHERE btrim(tax_label) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_tax_label_not_blank'
      AND conrelid = 'public.businesses'::regclass
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_tax_label_not_blank
      CHECK (btrim(tax_label) <> '');
  END IF;
END $$;

-- Any legacy unissued commercial state is a draft under the new lifecycle.
UPDATE public.quotes
SET estado = 'borrador'
WHERE numero IS NULL
  AND issued_at IS NULL
  AND estado <> 'borrador';

CREATE OR REPLACE FUNCTION public.enforce_quote_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.numero IS NULL AND NEW.issued_at IS NULL AND NEW.estado <> 'borrador' THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Un borrador no puede tener un estado comercial';
  END IF;

  IF OLD.numero IS NOT NULL OR OLD.issued_at IS NOT NULL THEN
    IF NEW.estado = 'borrador' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'Una cotización realizada no puede volver a borrador';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_quote_lifecycle() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS quotes_lifecycle_enforced ON public.quotes;
CREATE TRIGGER quotes_lifecycle_enforced
BEFORE INSERT OR UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_quote_lifecycle();

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
  quote_status text;
  client_template_key text;
  business_template_key text;
BEGIN
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Authentication required';
  END IF;

  SELECT quote.numero, quote.client_id, quote.pdf_template_key, quote.estado
  INTO current_number, quote_client_id, quote_template_key, quote_status
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
    SET estado = CASE WHEN quote_status = 'borrador' THEN 'enviada' ELSE quote_status END,
        pdf_template_key = COALESCE(
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

  IF quote_client_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.clients AS client
    WHERE client.id = quote_client_id
      AND client.user_id = requesting_user_id
      AND btrim(client.nombre) <> ''
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'A valid client is required before issuing a quote';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.quotes AS quote
    WHERE quote.id = _quote_id
      AND quote.user_id = requesting_user_id
      AND quote.fecha IS NOT NULL
      AND quote.validez_dias > 0
      AND quote.subtotal > 0
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Quote date, validity and positive amount are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.quote_items AS item
    WHERE item.quote_id = _quote_id
      AND item.user_id = requesting_user_id
  ) OR EXISTS (
    SELECT 1
    FROM public.quote_items AS item
    WHERE item.quote_id = _quote_id
      AND item.user_id = requesting_user_id
      AND (
        btrim(item.descripcion) = ''
        OR item.cantidad <= 0
        OR item.precio_unitario <= 0
      )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Every quote item requires description, quantity and unit price';
  END IF;

  INSERT INTO public.businesses (user_id)
  VALUES (requesting_user_id)
  ON CONFLICT (user_id) DO NOTHING;

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
      estado = 'enviada',
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

-- The browser keeps the same least-privilege column grants as the prior
-- issuance migration, with access only to the new business setting added.
GRANT INSERT (tax_label) ON public.businesses TO authenticated;
GRANT UPDATE (tax_label) ON public.businesses TO authenticated;
