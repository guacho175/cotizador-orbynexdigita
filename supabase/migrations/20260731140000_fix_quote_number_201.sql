-- Fix: la migración anterior usó WHERE next_quote_number = 1
-- pero el negocio ya estaba en 6, así que no hizo match.
-- Ahora forzamos a 201 para cualquier fila que esté por debajo.
UPDATE public.businesses
   SET next_quote_number = 201
 WHERE next_quote_number < 201;
