-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- businesses
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  rut text NOT NULL DEFAULT '',
  giro text NOT NULL DEFAULT '',
  direccion text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  sitio_web text NOT NULL DEFAULT '',
  logo_path text,
  banco_nombre text NOT NULL DEFAULT '',
  banco_tipo_cuenta text NOT NULL DEFAULT '',
  banco_numero_cuenta text NOT NULL DEFAULT '',
  banco_titular text NOT NULL DEFAULT '',
  banco_rut text NOT NULL DEFAULT '',
  banco_email text NOT NULL DEFAULT '',
  condiciones text NOT NULL DEFAULT '',
  pie_pagina text NOT NULL DEFAULT '',
  iva_percent numeric NOT NULL DEFAULT 19,
  next_quote_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX businesses_user_id_key ON public.businesses(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "businesses_own" ON public.businesses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- clients
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rut text NOT NULL DEFAULT '',
  contacto text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  direccion text NOT NULL DEFAULT '',
  notas text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clients_user_id_idx ON public.clients(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_own" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- quotes
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  numero integer,
  fecha date NOT NULL DEFAULT current_date,
  validez_dias integer NOT NULL DEFAULT 15,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviada','aceptada','rechazada')),
  atencion text NOT NULL DEFAULT '',
  subtotal numeric NOT NULL DEFAULT 0,
  iva numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  iva_percent numeric NOT NULL DEFAULT 19,
  snapshot_negocio jsonb,
  snapshot_cliente jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quotes_user_id_idx ON public.quotes(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_own" ON public.quotes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- quote_items
CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  descripcion text NOT NULL DEFAULT '',
  cantidad numeric NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quote_items_quote_id_idx ON public.quote_items(quote_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote_items_own" ON public.quote_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER quote_items_updated_at BEFORE UPDATE ON public.quote_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- profile auto creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.businesses (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- correlative quote number
CREATE OR REPLACE FUNCTION public.assign_quote_number(_quote_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _num integer;
  _current integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT numero INTO _current FROM public.quotes WHERE id = _quote_id AND user_id = _uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
  IF _current IS NOT NULL THEN RETURN _current; END IF;

  UPDATE public.businesses
    SET next_quote_number = next_quote_number + 1
    WHERE user_id = _uid
    RETURNING next_quote_number - 1 INTO _num;

  IF _num IS NULL THEN
    INSERT INTO public.businesses (user_id, next_quote_number) VALUES (_uid, 2)
    ON CONFLICT (user_id) DO NOTHING;
    _num := 1;
  END IF;

  UPDATE public.quotes SET numero = _num WHERE id = _quote_id AND user_id = _uid;
  RETURN _num;
END; $$;

REVOKE ALL ON FUNCTION public.assign_quote_number(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.assign_quote_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_quote_number(uuid) TO service_role;