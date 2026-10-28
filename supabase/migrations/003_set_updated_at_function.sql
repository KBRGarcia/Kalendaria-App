-- 05-Backend-Schema.md §3.7, §4.6 y §9.1: updated_at en profiles y activities.
-- Va después de 001 y 002: las dos tablas ya existen.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER activities_set_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
