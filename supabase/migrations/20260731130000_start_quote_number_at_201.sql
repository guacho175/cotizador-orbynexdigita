-- La numeración de cotizaciones debe partir en 00201.
ALTER TABLE public.businesses ALTER COLUMN next_quote_number SET DEFAULT 201;
UPDATE public.businesses SET next_quote_number = 201 WHERE next_quote_number = 1;
