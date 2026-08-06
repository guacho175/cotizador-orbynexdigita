-- 1. Drop trigger and function for folio_cliente
DROP TRIGGER IF EXISTS trg_assign_folio_cliente ON public.quotes;
DROP FUNCTION IF EXISTS public.assign_folio_cliente();

-- 2. Drop folio_cliente column
ALTER TABLE public.quotes DROP COLUMN IF EXISTS folio_cliente;

-- 3. Add is_archived column
ALTER TABLE public.quotes ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- 4. Standardize existing quotes to global numbering and set next_quote_number to 201 for current businesses
-- If any existing quote has numero = null, we need to assign it sequentially.
-- Actually, the user wants new businesses to start at 201.
ALTER TABLE public.businesses ALTER COLUMN next_quote_number SET DEFAULT 201;

DO $$
DECLARE
  _biz RECORD;
  _q RECORD;
  _seq INTEGER;
BEGIN
  -- Loop through each business
  FOR _biz IN SELECT * FROM public.businesses LOOP
    _seq := 1;
    -- For each business, order its quotes by created_at and renumber them 1, 2, 3...
    FOR _q IN 
      SELECT id FROM public.quotes 
      WHERE user_id = _biz.user_id 
      ORDER BY created_at ASC 
    LOOP
      UPDATE public.quotes SET numero = _seq WHERE id = _q.id;
      _seq := _seq + 1;
    END LOOP;
    
    -- Then, we ensure that next_quote_number is at least 201.
    -- If they already had 200+ quotes, we make it the max(_seq, 201)
    UPDATE public.businesses 
    SET next_quote_number = GREATEST(_seq, 201)
    WHERE id = _biz.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
