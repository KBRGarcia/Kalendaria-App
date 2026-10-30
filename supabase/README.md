# Esquema Kalendaria en DBeaver

Scripts de `docs/05-Backend-Schema.md`, sección 9. No incluyen claves ni datos de usuarios.

## Antes de ejecutar

1. Crea el proyecto en supabase.com. Nombre sugerido: `kalendaria`.
2. No crees otra base. Supabase ya crea una llamada `postgres`, con el esquema `auth` (`auth.users`, `auth.uid()`) y los roles `anon` y `authenticated`.
3. Esa base debe estar vacía de tablas de la app: no deben existir `public.profiles` ni `public.activities`.
4. No hace falta ninguna extensión. `gen_random_uuid()` viene en PostgreSQL 13 o posterior; Supabase usa PostgreSQL 15.
5. En DBeaver, conexión PostgreSQL al host de *Database* del proyecto (`db.<ref>.supabase.co`), puerto `5432`, base `postgres`, usuario `postgres` y la contraseña de la base. SSL obligatorio. Ese usuario no es la anon key ni la `service_role`.

La app no usa `service_role`. El cliente ya lee `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Correo

Confirm email debe estar **desactivado**. El plan gratuito no permite editar Confirm signup ni Magic Link, y la app no pide un código.

Las plantillas de `supabase/templates/` quedan guardadas para cuando haya plan de pago. No se usan ahora.

Página del proyecto: `https://supabase.com/dashboard/project/elqztqfepmnbfaqqyxyl/auth/providers`.

## Orden

Ejecuta cada archivo entero, uno detrás de otro (*Execute SQL Script*). Si uno falla, no sigas.

1. `supabase/migrations/001_create_profiles.sql`
2. `supabase/migrations/002_create_activities.sql`
3. `supabase/migrations/003_set_updated_at_function.sql`
4. `supabase/migrations/004_enable_rls.sql`
5. `supabase/migrations/005_update_last_login_function.sql`

El seed de la sección 9.2 no está aquí: pide un UUID real de `auth.users` y no debe versionarse con datos de personas.
