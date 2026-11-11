# Supabase en Kalendaria

**Versión:** 1.0 · **Fecha:** noviembre 2026 · **Documentos relacionados:** `05-Backend-Schema.md` (esquema SQL), `13-Backend-Flujo.md` (flujo de datos), `08-Guia-Produccion.md` (puesta en producción)

---

## 1. Qué es y por qué está en el proyecto

[Supabase](https://supabase.com) es una plataforma de backend como servicio construida sobre **PostgreSQL**. Entrega, ya hechos y listos para usar desde un cliente móvil:

- una **base de datos** relacional,
- un sistema de **autenticación** de usuarios,
- una **API REST** generada automáticamente a partir de las tablas,
- y un mecanismo de **seguridad por fila** (RLS) que decide qué datos puede ver cada usuario.

Kalendaria es una app móvil sin servidor propio. En vez de programar, desplegar y mantener un backend (servidor, base de datos, login, API, seguridad), la app habla **directamente** con Supabase desde el teléfono. Eso encaja con el objetivo del producto (PRD OBJ-04): que los datos vivan en la nube y sigan disponibles al cambiar de teléfono, con el mínimo de piezas que mantener.

> **En una frase:** Supabase es el único backend de Kalendaria. Guarda las cuentas, las actividades y las preferencias, y garantiza que cada persona solo acceda a lo suyo.

---

## 2. Qué parte de Supabase usa Kalendaria (y cuál no)

| Servicio de Supabase | ¿Se usa? | Para qué |
|---|---|---|
| **Auth** (GoTrue) | Sí | Registro, inicio y cierre de sesión con correo y contraseña; emisión y renovación de tokens (JWT). |
| **PostgreSQL** | Sí | Almacena `profiles` y `activities`, con restricciones (`CHECK`), índices y *triggers*. |
| **API REST (PostgREST)** | Sí | Cada consulta de la app (`supabase.from('activities')…`) se traduce a una petición HTTP a esta API. |
| **RLS** (Row Level Security) | Sí, crítico | Cada usuario solo lee y modifica sus propias filas. Es la barrera de seguridad real. |
| **Funciones RPC** | Sí | `update_last_login()` registra el último acceso. |
| **Realtime** | No | Backlog (sincronizar cambios entre dispositivos en vivo). |
| **Storage** | No | La app no guarda archivos. |
| **Edge Functions** | No | Aún no hay lógica de servidor propia. Será necesaria para "eliminar cuenta" (ver §9). |
| **Plantillas de correo / OTP** | No | El plan gratuito no permite editarlas; el flujo de código de 6 dígitos está aplazado. Los HTML se conservan en `supabase/templates/`. |

---

## 3. Cómo se conecta la app

### 3.1 Credenciales

La app necesita dos valores, ambos **públicos por diseño**:

| Variable | Qué es | Dónde vive |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Dirección del proyecto (`https://<ref>.supabase.co`) | `.env.local` en desarrollo; entorno de EAS en builds |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave publicable (`sb_publishable_…`; en proyectos antiguos, el JWT `anon`) | Igual |

Nunca va en la app, en el repositorio, en EAS ni en Vercel: la **`service_role`** / clave **secreta** (`sb_secret_…`). Esa clave **se salta RLS** y daría acceso total a los datos de todos los usuarios.

> **Por qué la clave pública no es un riesgo:** cualquiera puede extraerla del APK. Por eso la protección no está en ocultarla sino en RLS: con esa clave y sin una sesión válida, las consultas devuelven `[]`, y con una sesión solo se ven las filas propias. Se verificó contra el proyecto real (ver §8).

### 3.2 El cliente

[`src/lib/supabase.ts`](../src/lib/supabase.ts) crea un único cliente (`createClient<Database>`) que usa todo el código:

- **Tipado:** recibe el genérico `Database` (`src/types/database.ts`, generado por la CLI de Supabase), así que las consultas están tipadas de extremo a extremo.
- **Sesión en el llavero:** `auth.storage` es un adaptador sobre `expo-secure-store`. Los tokens se guardan en el almacén seguro del sistema (Keystore de Android / Keychain de iOS), no en texto plano. Como Android limita cada valor a 2048 bytes y una sesión de Supabase lo supera, el adaptador **parte** el valor en trozos de 1800 caracteres.
- **Opciones:** `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false` (no hay enlaces mágicos).
- **Polyfill:** `react-native-url-polyfill/auto` aporta la API `URL` que supabase-js necesita y React Native no trae.

> **Lección aprendida (v1.0.0):** las variables `EXPO_PUBLIC_*` se **sustituyen por su valor al compilar** y solo si se leen de forma estática (`process.env.EXPO_PUBLIC_X`). Una lectura dinámica (`process.env[nombre]`) funciona en desarrollo pero devuelve `undefined` en el APK, y la app se cierra al abrir. `tests/env.test.ts` lo vigila y `npm run release:verify` lo comprueba en el APK.

---

## 4. Qué datos guarda

```
auth.users  (gestionada por Supabase: correo, hash de contraseña, ids)
   ├── 1 ── 1  public.profiles    email, last_login_at, theme_preference, created_at, updated_at
   └── 1 ── N  public.activities  id, user_id, date, title, category, note, created_at, updated_at
```

- **`profiles`**: una fila por usuario, creada automáticamente por el *trigger* `on_auth_user_created` al registrarse. Guarda la preferencia de tema (para restaurarla en otro dispositivo) y el último acceso.
- **`activities`**: las actividades. `title` (1–100 caracteres), `category` (`reunion`, `pendiente`, `personal`, `trabajo`, `otro`) y `note` (≤ 500) se validan también **en la base de datos** con `CHECK`, no solo en la app.
- **`ON DELETE CASCADE`**: borrar un usuario en *Authentication → Users* elimina en cascada su perfil y todas sus actividades.

El detalle SQL completo está en `05-Backend-Schema.md` y en `supabase/migrations/001…005`.

---

## 5. Seguridad: el modelo en tres capas

1. **Autenticación.** Supabase Auth verifica correo y contraseña (almacenada con bcrypt) y emite un JWT de corta vida más un *refresh token*. La app lo guarda en el llavero.
2. **RLS en cada tabla.** Las políticas usan `auth.uid()` (el id del usuario del JWT). `profiles`: solo `SELECT` y `UPDATE` propios; no hay `INSERT` ni `DELETE` para el cliente. `activities`: `SELECT`, `INSERT`, `UPDATE` y `DELETE` solo de filas propias (con `WITH CHECK`, así que nadie puede insertar ni mover filas a nombre de otro).
3. **Funciones con mínimo privilegio.** `update_last_login()` es `SECURITY DEFINER` con `search_path` fijo y `EXECUTE` revocado a `PUBLIC` y `anon`; solo `authenticated` puede llamarla, y solo toca su propia fila.

Mensajes de error al usuario: genéricos ("Correo o contraseña incorrectos"), sin revelar si falló el correo o la contraseña.

---

## 6. Configuración del proyecto (panel de Supabase)

| Ajuste (Authentication) | Valor | Motivo |
|---|---|---|
| Email provider | Activado | Acceso con correo y contraseña |
| **Confirm email** | **Desactivado** | Sin plantillas editables ni código OTP en el plan gratuito. Si se activa, **nadie puede registrarse** |
| Enable email signups | Activado | Registro abierto |
| Longitud mínima de contraseña | 8 | Coincide con la validación de la app (8, una letra y un número) |
| Phone / Anonymous sign-ins | Desactivados | No se usan |
| Rate limits | Por defecto | — |

Ruta típica en el panel: **Authentication → Sign In / Providers → Email**. Los nombres de menú cambian con el tiempo; busca "Email" y "Confirm email".

---

## 7. Operación en el plan gratuito

| Tema | Qué ocurre | Qué hace el proyecto |
|---|---|---|
| **Pausa por inactividad** | Los proyectos Free se pausan tras ~1 semana sin actividad y la app deja de funcionar hasta reactivarlo en el panel | `.github/workflows/keepalive.yml` consulta la API cada 3 días (solo lectura). Requiere los secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` en GitHub |
| **Copias de seguridad** | El plan Free no ofrece copias descargables automáticas (verifica en tu panel) | `npm run db:backup` genera un respaldo con `pg_dump` (esquema + datos de `public` y datos de `auth`) |
| **Límites** | Almacenamiento, usuarios activos y transferencia limitados | Muy por encima de lo que usa una agenda personal; revisa [supabase.com/pricing](https://supabase.com/pricing) si crece |
| **Un solo proyecto** | Desarrollo y producción comparten el mismo proyecto (decisión: ahorrar cupos del plan Free) | Probar con una cuenta propia de prueba, respaldar antes de cambiar el esquema y escribir migraciones que solo añadan |

### 7.1 Cambios de esquema

1. Escribe una migración nueva (`006_…sql`) que **añada**, sin borrar columnas ni tablas.
2. Haz un respaldo: `npm run db:backup`.
3. Ejecútala en el **SQL Editor** (o con la CLI) y revisa **Advisors → Security**.
4. Si cambia la forma de los datos, regenera los tipos: `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`.
5. Añade el archivo al repositorio y actualiza `05-Backend-Schema.md`.

---

## 8. Cómo se verifica que está bien

Comprobaciones de **solo lectura** (no escriben ni borran datos):

```sql
-- RLS activo en ambas tablas (esperado: rowsecurity = true)
select tablename, rowsecurity from pg_tables where schemaname = 'public';

-- Políticas (esperado: 2 en profiles y 4 en activities)
select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by 1, 3;
```

Y, sin sesión, con la clave publicable, las consultas a `activities` y `profiles` deben devolver `[]`, y la RPC `update_last_login` debe responder `permission denied` (código `42501`). Esto se comprobó contra el proyecto real en noviembre de 2026. Si ves **Advisors → Security** sin alertas de "RLS disabled" para esas tablas, la seguridad está correcta.

---

## 9. Pendientes y evolución

- **Eliminación de cuenta.** Google Play exige poder eliminar la cuenta desde la app. Hace falta una **Edge Function** (o similar) que use la `service_role` **solo del lado servidor** para borrar el usuario de `auth.users` (el `CASCADE` borra el resto). No está implementada.
- **Código de verificación por correo.** Vuelve cuando el plan permita editar plantillas (`supabase/templates/`).
- **Realtime, sincronización offline completa, categorías personalizables:** ver backlog en `02-TRD.md` §17.
- **Entorno de desarrollo aislado.** Cuando el esquema cambie con frecuencia, valorar Supabase CLI + Docker (`supabase start`) para una base local gratuita, o un segundo proyecto.

---

## 10. Dónde mirar en el panel

| Quiero… | Ruta |
|---|---|
| Ver/borrar usuarios | Authentication → Users |
| Ver tablas y confirmar RLS | Table Editor |
| Ver y editar políticas | Authentication → Policies |
| Ejecutar SQL | SQL Editor |
| URL y claves | Connect (barra superior) · Project Settings → API Keys |
| Cadena de conexión de la base | Connect → Session pooler |
| Alertas de seguridad | Advisors → Security |
| Reactivar un proyecto pausado | Página principal del proyecto |
