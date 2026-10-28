-- 05-Backend-Schema.md §3 y §9.1: profiles y alta automática desde auth.users.
-- Requiere el esquema auth de Supabase (tabla auth.users). No crea ese esquema.

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  last_login_at timestamptz,
  theme_preference text NOT NULL DEFAULT 'system'
    CHECK (theme_preference IN ('light', 'dark', 'system')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- El PK ya indexa id. El documento lo pide explícito por claridad.
CREATE UNIQUE INDEX profiles_id_idx ON public.profiles(id);

-- SECURITY DEFINER: el alta la hace el trigger, no el cliente.
-- search_path fijo para no resolver objetos según el path de quien dispara el trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Función de trigger: no es invocable por RPC. No se revoca EXECUTE a PUBLIC
-- porque el rol que inserta en auth.users (supabase_auth_admin) dispara el trigger.
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
