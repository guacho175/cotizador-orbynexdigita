-- 1. Add new column for independent numbering per client
ALTER TABLE public.quotes ADD COLUMN folio_cliente integer;

-- 2. Trigger function to assign the number per client automatically before insert or update
CREATE OR REPLACE FUNCTION public.assign_folio_cliente()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- We only assign if client_id is present and folio is not yet assigned
  IF NEW.client_id IS NOT NULL AND NEW.folio_cliente IS NULL THEN
    SELECT COALESCE(MAX(folio_cliente), 0) + 1 INTO NEW.folio_cliente
    FROM public.quotes
    WHERE client_id = NEW.client_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_assign_folio_cliente
BEFORE INSERT OR UPDATE OF client_id ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.assign_folio_cliente();

-- 3. Backfill script to populate historical data without collisions
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY created_at ASC) as fn
  FROM public.quotes
  WHERE client_id IS NOT NULL
)
UPDATE public.quotes q
SET folio_cliente = n.fn
FROM numbered n
WHERE q.id = n.id AND q.folio_cliente IS NULL;
