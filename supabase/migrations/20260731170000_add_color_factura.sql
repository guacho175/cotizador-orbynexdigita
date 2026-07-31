-- Add color_factura column to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS color_factura text;
