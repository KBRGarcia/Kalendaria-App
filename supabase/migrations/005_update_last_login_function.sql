-- 05-Backend-Schema.md §5.4 y §9.1.
-- Solo el usuario autenticado actualiza su propia fila (auth.uid()).
-- Se revoca PUBLIC y anon: en PostgreSQL una función nueva queda ejecutable por PUBLIC,
-- y en Supabase los privilegios por defecto también se la conceden a anon.

CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login_at = now()
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.update_last_login() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_last_login() FROM anon;
GRANT EXECUTE ON FUNCTION public.update_last_login() TO authenticated;
