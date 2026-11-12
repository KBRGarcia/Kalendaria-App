# Backend Schema
## Kalendaria — App de Agenda y Calendario Personal

**Versión:** 1.1
**Fecha:** Octubre 2026 · actualizado en noviembre 2026
**Estado:** migraciones 001–005 aplicadas y verificadas; 006 (categoría personalizada) pendiente de aplicar
**Documentos base:** `01-PRD.md`, `02-TRD.md`
**Documentos relacionados:** `09-Supabase.md` (el servicio), `13-Backend-Flujo.md` (flujo de datos y peticiones HTTP)
**Plataforma:** Supabase (PostgreSQL + Auth + RLS)

---

## 1. Resumen

Kalendaria utiliza **Supabase** como backend. El esquema se compone de:

- **Autenticación:** gestionada por `auth.users` (esquema interno de Supabase).
- **Perfil de usuario:** tabla `profiles` que extiende `auth.users` con datos propios de la app.
- **Actividades:** tabla `activities` que almacena cada evento/tarea anotada en el calendario.

**Principios de diseño del esquema:**

1. **Mínimo necesario.** Solo las tablas indispensables para el MVP.
2. **Seguridad por defecto.** Row Level Security (RLS) activo en todas las tablas.
3. **Integridad referencial.** FKs con `ON DELETE CASCADE` para mantener consistencia.
4. **Escalable.** Preparado para añadir features futuras sin migraciones destructivas.
5. **Auditable.** Timestamps de creación y actualización en cada fila.

---

## 2. Diagrama de Relaciones

┌─────────────────────┐
│ auth.users │ (esquema interno de Supabase)
│ ──────────────── │
│ id (uuid, PK) │
│ email (text) │
│ encrypted_password │
│ created_at │
│ last_sign_in_at │
│ ... │
└──────────┬──────────┘
│ 1
│
│ 1
│
┌──────────▼──────────┐ ┌──────────────────────┐
│ profiles │ │ activities │
│ ──────────────── │ │ ────────────────── │
│ id (uuid, PK, FK) │◄────────│ user_id (uuid, FK) │
│ email (text) │ 1 N │ id (uuid, PK) │
│ last_login_at │ │ date (date) │
│ theme_preference │ │ title (text) │
│ created_at │ │ category (text) │
│ updated_at │ │ note (text) │
└─────────────────────┘ │ created_at │
│ updated_at │
└──────────────────────┘


**Relaciones:**

- `auth.users` (1) ── (1) `profiles` — cada usuario tiene un único perfil.
- `auth.users` (1) ── (N) `activities` — un usuario puede tener muchas actividades.
- `activities.user_id` → `auth.users.id` (no directamente a `profiles.id`, aunque son el mismo UUID; apuntamos al origen para mantener integridad con la fuente de verdad de auth).

---

## 3. Tabla `profiles`

### 3.1. Propósito

Extiende `auth.users` con datos específicos de la app que no pertenecen al sistema de autenticación: preferencia de tema y último acceso.

### 3.2. Definición SQL

sql
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

-- Índice (aunque es PK, explícito para claridad)
CREATE UNIQUE INDEX profiles_id_idx ON public.profiles(id);

### 3.3. Columnas

Columna   |   Tipo   |   Nulo   |   Default   |   Descripción
id   |   uuid   |   NO   |   —   |   PK, FK a auth.users.id. Mismo UUID que el usuario.
email   |   text   |   NO   |   —   |   Copia del email del usuario. Denormalizado por conveniencia.
last_login_at   |   timestamptz   |   SÍ   |   NULL   |   Último acceso con sesión. Se guarda para el código de correo, cuando vuelva.
theme_preference	   |   text   |   NO   |   'system'   |   Preferencia de tema. Solo 'light', 'dark' o 'system'.
created_at   |   timestamptz   |   NO   |   now()   |   Fecha de creación del perfil.
updated_at   |   timestamptz   |   NO   |   now()   |   Fecha de última modificación.

### 3.4. Reglas de negocio asociadas

- last_login_at se actualiza al completar el registro o el login con sesión. La llamada es **no bloqueante**: si falla, el acceso del usuario continúa.
- La regla de los 30 días y el código de correo no se aplican. Vuelven con el plan de pago.

### 3.5. Políticas RLS

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: solo el propio usuario
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- UPDATE: solo el propio usuario
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- INSERT: bloqueado para el cliente (se hace vía trigger)
-- DELETE: bloqueado para el cliente (se hace en cascada con auth.users)

### 3.6. Trigger de creación automática

Cuando se crea un usuario en auth.users, se inserta automáticamente su fila en profiles:

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

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

### 3.7. Trigger de actualización de updated_at

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

---

## 4. Tabla activities

### 4.1. Propósito

Almacena cada actividad creada por un usuario en una fecha concreta.

### 4.2. Definición SQL

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text NOT NULL
    CHECK (char_length(title) BETWEEN 1 AND 100),
  category text NOT NULL
    CHECK (category IN ('reunion', 'pendiente', 'personal', 'trabajo', 'otro')),
  note text
    CHECK (note IS NULL OR char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice principal: consultas por usuario y rango de fechas (mes)
CREATE INDEX activities_user_date_idx
ON public.activities(user_id, date);

-- Índice secundario: por fecha (útil si en el futuro hay queries globales)
CREATE INDEX activities_date_idx ON public.activities(date);

### 4.3. Columnas

Columna   |   Tipo   |   Nulo   |   Default   |   Descripción
id   |   uuid   |   NO   |   gen_random_uuid()   |   PK. Identificador único de la actividad.
user_id   |   uuid   |   NO   |   —   |   FK a auth.users.id. Propietario de la actividad.
custom_category_name   |   text   |   SÍ   |   NULL   |   Nombre propio de la categoría. Solo con category = 'otro'. 1–30 caracteres.
custom_category_color   |   text   |   SÍ   |   NULL   |   Color hex (#RRGGBB) de la paleta de la app. Va siempre junto al nombre.
date   |   date   |   NO   |   —   |   Fecha de la actividad (YYYY-MM-DD).
title   |   text   |   NO   |   —   |   Título. Entre 1 y 100 caracteres.
category   |   text   |   NO   |   —   |   Categoría. Valores permitidos: reunion, pendiente, personal, trabajo, otro.
note   |   text   |   SÍ   |   NULL   |   Nota opcional. Máximo 500 caracteres.
created_at   |   timestamptz   |   NO   |   now()   |   Fecha de creación.
updated_at   |   timestamptz   |   NO   |   now()   |   Fecha de última modificación.

### 4.4. Reglas de negocio asociadas

- El title no puede estar vacío ni contener solo espacios en blanco (validar en cliente + servidor).
- La category debe ser exactamente uno de los 5 valores definidos. Se valida en el CHECK del esquema y en el cliente vía enum TypeScript.
- La date puede ser pasada, presente o futura. No hay restricción.
- El user_id siempre debe coincidir con auth.uid() (garantizado por la política RLS de INSERT).

### 4.5. Políticas RLS

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- SELECT: solo actividades propias
CREATE POLICY "Users can view own activities"
ON public.activities FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: solo se pueden crear actividades propias
CREATE POLICY "Users can insert own activities"
ON public.activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: solo se pueden modificar actividades propias
CREATE POLICY "Users can update own activities"
ON public.activities FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: solo se pueden borrar actividades propias
CREATE POLICY "Users can delete own activities"
ON public.activities FOR DELETE
USING (auth.uid() = user_id);

### 4.6. Trigger de actualización de updated_at

CREATE TRIGGER activities_set_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

---

## 5. Autenticación — Flujos y Configuración

### 5.1. Configuración del proyecto Supabase

En Authentication → Providers → Email:

- ✅ Enable Email provider.
- ❌ Confirm email: desactivado. El plan gratuito no permite editar las plantillas, y la app no pide código.
- ❌ Secure email change: desactivado en MVP (no hay cambio de email).
- ✅ Enable email signups: activado.
- ❌ Enable phone signups: desactivado.
- ❌ Anonymous sign-ins: desactivado.

En Authentication → Rate Limits:

- Mantener los valores por defecto de Supabase.

El código de 6 dígitos y la caducidad de 600 segundos se configuran cuando haya plan de pago.

### 5.2. Flujo de Registro

[Cliente]                             [Supabase]
   │                                      │
   │ signUp({ email, password })          │
   ├─────────────────────────────────────►│
   │                                      │ 1. Crea usuario en auth.users
   │                                      │    (confirmado, sin correo)
   │                                      │ 2. Trigger crea fila en profiles
   │◄─────────────────────────────────────┤
   │  { user, session }                   │
   │                                      │
   │ update_last_login()                  │
   ├─────────────────────────────────────►│
   │ (App navega a /(app)/calendar)       │

Si Confirm email sigue activo, la respuesta trae `session: null`. La app muestra un error genérico ("No se pudo completar el registro en este momento") y no abre pantalla de código. Si el correo ya existe, `user.identities` llega vacío y la app muestra "Ese correo ya tiene una cuenta".

> **Verificado (nov 2026):** el estado público de Auth del proyecto expone `mailer_autoconfirm`; debe ser `true` para que el registro funcione.

### 5.3. Flujo de Login

[Cliente]                             [Supabase]
   │                                      │
   │ signInWithPassword({ email, pass })  │
   ├─────────────────────────────────────►│
   │◄─────────────────────────────────────┤
   │  { user, session }                   │
   │                                      │
   │ update_last_login()                  │
   ├─────────────────────────────────────►│
   │  → Navegar a /(app)/calendar         │

No hay código ni regla de 30 días. `last_login_at` solo se registra.
   
### 5.4. Función RPC para actualizar last_login_at

Evita exponer un UPDATE directo sobre profiles desde el cliente (aunque RLS lo permitiría). Mejor tener una función explícita:

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

-- En PostgreSQL una función nueva es ejecutable por PUBLIC (y en Supabase también por anon).
REVOKE ALL ON FUNCTION public.update_last_login() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_last_login() FROM anon;
-- Permitir que usuarios autenticados ejecuten la función
GRANT EXECUTE ON FUNCTION public.update_last_login() TO authenticated;

Verificado: llamada como `anon` → `permission denied for function update_last_login` (42501).

Llamada desde el cliente:

await supabase.rpc('update_last_login');

### 5.5. Manejo de sesión en el cliente

Código real en `src/lib/supabase.ts` (resumen):

```ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@/types/database';

// Android limita cada valor de SecureStore a 2048 bytes y una sesión de Supabase lo supera:
// el adaptador parte el valor en trozos de 1800 caracteres (clave.chunk-count, clave.chunk.N).
const secureStoreAdapter = { getItem, setItem, removeItem };   // ver el archivo

// IMPORTANTE: acceso ESTÁTICO a process.env.EXPO_PUBLIC_X. Expo lo sustituye al compilar;
// process.env[nombre] devuelve undefined en el APK y la app se cierra al abrir.
export const supabase = createClient<Database>(
  requirePublicEnv('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  requirePublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  { auth: { storage: secureStoreAdapter, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } },
);
```

Decisión de Fase 0: este adaptador se mantiene. La guía rápida de Supabase para Expo usa `expo-sqlite/localStorage` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Aquí la sesión va en SecureStore y la variable sigue llamándose `EXPO_PUBLIC_SUPABASE_ANON_KEY`. No sustituyas ninguna de las dos cosas sin decidirlo antes. Los proyectos nuevos de Supabase entregan una clave con formato `sb_publishable_…` en lugar del JWT `anon`; el cliente funciona con ambas.

---

## 6. Tipos TypeScript (generados por Supabase)

Se generan automáticamente con:

npx supabase gen types typescript --project-id <project-id> > src/types/database.ts

Resultado esperado (resumido):

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          last_login_at: string | null;
          theme_preference: 'light' | 'dark' | 'system';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          last_login_at?: string | null;
          theme_preference?: 'light' | 'dark' | 'system';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          last_login_at?: string | null;
          theme_preference?: 'light' | 'dark' | 'system';
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          title: string;
          category: 'reunion' | 'pendiente' | 'personal' | 'trabajo' | 'otro';
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          title: string;
          category: 'reunion' | 'pendiente' | 'personal' | 'trabajo' | 'otro';
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          date?: string;
          title?: string;
          category?: 'reunion' | 'pendiente' | 'personal' | 'trabajo' | 'otro';
          note?: string | null;
          updated_at?: string;
        };
      };
    };
    Functions: {
      update_last_login: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
  };
};

Tipos de dominio reales (`src/types/activity.ts`):

```ts
export type Activity = Tables<'activities'>;   // derivado de database.ts; category llega como string

export interface ActivityCreateInput {
  date: string;                 // YYYY-MM-DD
  title: string;
  category: ActivityCategory;   // 'reunion' | 'pendiente' | 'personal' | 'trabajo' | 'otro'
  note?: string;
}

export interface ActivityUpdateInput {   // en el código real los tres campos son obligatorios
  title: string;
  category: ActivityCategory;
  note: string | null;
}
```

Nota: `database.ts` generado por la CLI tipa `category` como `string`; el código valida el valor con `isActivityCategory()` al leerlo (si llega uno desconocido, se muestra como "Otro").

---

## 7. Consultas Principales (capa de servicios)

Código real en `src/services/activitiesService.ts` y `src/services/authService.ts`. Todas las funciones lanzan un `ActivityRequestError` / `AuthRequestError` con un mensaje ya en español.

### 7.1. activitiesService.fetchByMonth

```ts
const ACTIVITY_COLUMNS = 'id, user_id, date, title, category, note, created_at, updated_at';

const range = monthRange(year, month);           // { start: '2026-11-01', end: '2026-11-30' }
const { data, error } = await supabase
  .from('activities')
  .select(ACTIVITY_COLUMNS)
  .gte('date', range.start).lte('date', range.end)
  .order('date', { ascending: true })
  .order('created_at', { ascending: true });
```

### 7.2. activitiesService.create

```ts
const userId = await requireUserId();            // supabase.auth.getUser()
await supabase.from('activities')
  .insert({ user_id: userId, date, title: title.trim(), category, note: emptyToNull(note) })
  .select(ACTIVITY_COLUMNS).single();
```

### 7.3. activitiesService.update

```ts
await supabase.from('activities')
  .update({ title: input.title.trim(), category: input.category, note: input.note })
  .eq('id', id).select(ACTIVITY_COLUMNS).single();
```

### 7.4. activitiesService.remove

```ts
await supabase.from('activities').delete().eq('id', id);
```

### 7.5. authService.updateLastLogin

```ts
await supabase.rpc('update_last_login');   // se invoca de forma no bloqueante tras signIn/signUp
```

### 7.6. authService.updateThemePreference / loadThemePreference

```ts
await supabase.from('profiles').update({ theme_preference: pref }).eq('id', userId);
await supabase.from('profiles').select('theme_preference').eq('id', userId).maybeSingle();
```

### 7.7. Peticiones HTTP equivalentes

La tabla completa de llamadas `supabase-js` → petición HTTP → SQL está en `13-Backend-Flujo.md` §4.

---

## 8. Caché Local (AsyncStorage)

### 8.1. Claves utilizadas

Clave   |   Contenido   |   Formato
@kalendaria:cache:activities:YYYY-MM   |   Actividades de un mes   |   JSON array
@kalendaria:theme   |   Preferencia de tema   |   string
@kalendaria:lastSync   |   Timestamp de la última sincronización	ISO   |   string

### 8.2. Estrategia de invalidación

- Al crear/editar/eliminar una actividad → se **reescribe** la caché del mes afectado con el estado ya actualizado.
- Al iniciar sesión o registrarse → limpiar toda la caché y recargar.
- Al cerrar sesión → limpiar toda la caché (`clearAllCache` solo toca las claves de la caché y conserva el tema).
- Si la caché está corrupta o no tiene la forma esperada, se ignora.

### 8.3. Estructura del caché

interface CachedMonth {
  year: number;
  month: number;
  activities: Activity[];
  cachedAt: string;  // ISO timestamp
}

Nota: No cacheamos profiles porque theme_preference se maneja por separado y el resto de datos (email, last_login) cambian raramente.

---

## 9. Migraciones y Seed

### 9.1. Orden de migraciones

1. 001_create_profiles.sql — Tabla profiles + trigger de creación desde auth.
2. 002_create_activities.sql — Tabla activities + índices.
3. 003_set_updated_at_function.sql — Función set_updated_at + triggers en ambas tablas.
4. 004_enable_rls.sql — Activar RLS + políticas en profiles y activities.
5. 005_update_last_login_function.sql — Función RPC update_last_login.
6. 006_add_custom_category.sql — Columnas custom_category_name y custom_category_color en activities (categoría personalizada de «Otro»; nulables y compatibles con el APK 1.0.0).

### 9.2. Seed (solo para desarrollo)

-- Usuario de prueba (crear primero vía UI, luego insertar actividades)
INSERT INTO public.activities (user_id, date, title, category, note)
VALUES
  ('<uuid-del-usuario>', CURRENT_DATE, 'Reunión con el equipo', 'reunion', 'Sala 3, 10am'),
  ('<uuid-del-usuario>', CURRENT_DATE, 'Enviar reporte', 'pendiente', NULL),
  ('<uuid-del-usuario>', CURRENT_DATE + 1, 'Cita médica', 'personal', 'Llevar exámenes'),
  ('<uuid-del-usuario>', CURRENT_DATE - 2, 'Entrega de proyecto', 'trabajo', 'Completado a tiempo');
  
Importante: nunca commitear seeds con datos reales ni UUIDs de producción.

---

## 10. Backup y Recuperación

> **Corrección a la versión 1.0:** el documento afirmaba que el plan gratuito incluye copias automáticas diarias con 7 días de retención. El plan gratuito **no ofrece copias descargables automáticas** (verifica el estado de tu plan en el panel de Supabase). La responsabilidad del respaldo es del proyecto.

- **Respaldo manual:** `npm run db:backup` (`scripts/backup-db.sh`) genera con `pg_dump`, en `backups/` (ignorada por git):
  - `kalendaria-public-FECHA.sql`: esquema y datos de `public` (profiles, activities, funciones, RLS).
  - `kalendaria-auth-FECHA.sql`: solo datos de `auth.users` y `auth.identities` (cuentas y hashes de contraseña). **Sensible**: no compartir ni subir.
- Necesita `pg_dump` y `SUPABASE_DB_URL` (Connect → *Session pooler*, compatible con IPv4).
- **Cuándo:** antes de cualquier migración y de forma periódica; guardar una copia fuera del equipo.
- **Pausa por inactividad:** el workflow `.github/workflows/keepalive.yml` consulta la API cada 3 días.
- Para producción con más usuarios: plan Pro con copias diarias y *Point-in-Time Recovery*.

---

## 11. Consideraciones de Seguridad

Aspecto   |   Estado
RLS activo en todas las tablas   |   ✅
Comunicación HTTPS/TLS   |   ✅ (Supabase por defecto)
Contraseñas hasheadas con bcrypt   |   ✅ (Supabase Auth)
Tokens almacenados en SecureStore   |   ✅
Anon key expuesta en cliente   |   ✅ (por diseño; RLS protege los datos)
Service role key en cliente   |   ❌ NUNCA
Validación de inputs en cliente   |   ✅
Validación de inputs en servidor (CHECK)   |   ✅
Rate limiting de Auth   |   ✅ (Supabase por defecto)

---

## 12. Escalabilidad y Evolución

El esquema está preparado para añadir sin migraciones destructivas:
- Categorías personalizables: añadir columna color a una nueva tabla categories y FK desde activities.category (migrar de text a uuid).
- Actividades recurrentes: añadir columna recurrence_rule (text, RRULE) y tabla recurrence_exceptions.
- Multi-calendario: añadir tabla calendars y FK desde activities.
- Notificaciones: añadir tabla notifications_scheduled (aunque fuera de scope actual).
- Sync offline completo: añadir updated_at + deleted_at para soft deletes y cola de operaciones en cliente.

--- 

## 13. Checklist de Validación del Esquema

Estado tras la puesta en producción (nov 2026). "Verificado" = comprobado contra el proyecto real con operaciones de solo lectura.

| Verificación | Estado |
|---|---|
| Todas las tablas tienen RLS activo | ✅ Verificado (sin sesión, `activities` y `profiles` devuelven `[]`); confirmar visualmente con `select tablename, rowsecurity from pg_tables where schemaname = 'public'` |
| Políticas RLS probadas con usuarios distintos | ⏳ Pendiente de prueba manual con dos cuentas (recomendado antes de abrir el registro al público) |
| El trigger `handle_new_user` crea el perfil al registrarse | ✅ Probado en uso real (el tema se guarda y se lee de `profiles`) |
| Los `CHECK` rechazan datos inválidos | ✅ Definidos en las migraciones; la app valida antes de enviar (cubierto por pruebas) |
| `created_at` / `updated_at` se mantienen | ✅ *Triggers* definidos en `003` |
| El índice `activities_user_date_idx` sirve la consulta mensual | ✅ La consulta filtra por `user_id` (vía RLS) y rango de `date` |
| `update_last_login` solo la ejecuta un usuario autenticado sobre su perfil | ✅ Verificado: como `anon` → `42501 permission denied` |
| Los tipos TypeScript coinciden con el esquema | ✅ `src/types/database.ts` generado; `tsc` sin errores |
| *Confirm email* desactivado | ✅ Requisito de configuración (el registro falla si está activo) |
