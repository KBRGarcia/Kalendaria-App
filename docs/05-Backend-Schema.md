# Backend Schema
## Kalendaria — App de Agenda y Calendario Personal

**Versión:** 1.0
**Fecha:** Octubre 2026
**Estado:** Aprobado
**Documentos base:** `01-PRD.md`, `02-TRD.md`
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

Extiende `auth.users` con datos específicos de la app que no pertenecen al sistema de autenticación: preferencia de tema, último login personalizado (para la regla de los 30 días), etc.

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
last_login_at   |   timestamptz   |   SÍ   |   NULL   |   Último login verificado con éxito (para la regla de 30 días).
theme_preference	   |   text   |   NO   |   'system'   |   Preferencia de tema. Solo 'light', 'dark' o 'system'.
created_at   |   timestamptz   |   NO   |   now()   |   Fecha de creación del perfil.
updated_at   |   timestamptz   |   NO   |   now()   |   Fecha de última modificación.

### 3.4. Reglas de negocio asociadas

- last_login_at se actualiza cada vez que un login se completa con éxito (con o sin OTP adicional).
- La regla de los 30 días se evalúa antes del login: now() - last_login_at >= 30 días → requiere OTP.
- Si last_login_at es NULL (usuario nuevo que nunca inició sesión), no se requiere OTP adicional (el registro ya verificó por OTP).

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
- ✅ Confirm email: activado (obliga a verificar por OTP antes de poder iniciar sesión).
- ❌ Secure email change: desactivado en MVP (no hay cambio de email).
- ✅ Email OTP expiration: 600 segundos (10 minutos).
- ✅ Email OTP length: 6 dígitos.
- ❌ Enable email signups: ✅ activado.
- ❌ Enable phone signups: desactivado.
- ❌ Anonymous sign-ins: desactivado.

En Authentication → Rate Limits:

- Mantener los valores por defecto de Supabase.
- Máximo 4 emails por hora por usuario para prevenir abuso de OTP.

### 5.2. Flujo de Registro

[Cliente]                             [Supabase]
   │                                      │
   │ signUp({ email, password })          │
   ├─────────────────────────────────────►│
   │                                      │ 1. Crea usuario en auth.users
   │                                      │    (estado: unconfirmed)
   │                                      │ 2. Trigger crea fila en profiles
   │                                      │ 3. Envía OTP al email
   │◄─────────────────────────────────────┤
   │  { user, session: null }             │
   │                                      │
   │ (App navega a /(auth)/verify)        │
   │                                      │
   │ verifyOtp({ email, token,            │
   │   type: 'signup' })                  │
   ├─────────────────────────────────────►│
   │                                      │ 4. Valida OTP
   │                                      │ 5. Marca usuario como confirmed
   │                                      │ 6. Actualiza last_login_at
   │◄─────────────────────────────────────┤
   │  { user, session }                   │
   │                                      │
   │ (App navega a /(app)/calendar)       │
   
### 5.3. Flujo de Login con "confianza por tiempo"

RLS impide leer `last_login_at` antes de autenticarse. El cliente valida la contraseña, lee el perfil y solo entonces decide si hace falta OTP. Si hace falta, cierra esa sesión antes de enviar el código: si no, el guard de `/(app)` dejaría entrar sin verificar.

[Cliente]                             [Supabase]
   │                                      │
   │ signInWithPassword({ email, pass })  │
   ├─────────────────────────────────────►│
   │◄─────────────────────────────────────┤
   │  { user, session }                   │
   │                                      │
   │ select last_login_at                 │
   ├─────────────────────────────────────►│
   │◄─────────────────────────────────────┤
   │                                      │
   │ ¿last_login_at es null o < 30 días?  │
   │                                      │
   │ ─── SÍ ───                           │
   │  update_last_login()                 │
   ├─────────────────────────────────────►│
   │  → Navegar a /(app)/calendar         │
   │                                      │
   │ ─── NO (30 días o más) ───           │
   │  signOut (scope local)               │
   │  signInWithOtp({ email })            │
   ├─────────────────────────────────────►│
   │  → Navegar a /(auth)/verify?mode=login│
   │                                      │
   │  verifyOtp({ email, token,           │
   │    type: 'email' })                  │
   ├─────────────────────────────────────►│
   │  update_last_login()                 │
   │  → Navegar a /(app)/calendar         │
   
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

-- Permitir que usuarios autenticados ejecuten la función
GRANT EXECUTE ON FUNCTION public.update_last_login() TO authenticated;

Llamada desde el cliente:

await supabase.rpc('update_last_login');

### 5.5. Manejo de sesión en el cliente

// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

Decisión de Fase 0: este adaptador se mantiene. La guía rápida de Supabase para Expo (octubre 2026) usa `expo-sqlite/localStorage` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Aquí la sesión va en SecureStore y la clave sigue llamándose `EXPO_PUBLIC_SUPABASE_ANON_KEY`. No sustituyas ninguna de las dos cosas sin decidirlo antes. No importes este módulo en el layout mientras el `.env.local` esté vacío.

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

Tipos de dominio (en src/types/activity.ts):

export type ActivityCategory =
  | 'reunion'
  | 'pendiente'
  | 'personal'
  | 'trabajo'
  | 'otro';

export interface Activity {
  id: string;
  user_id: string;
  date: string;          // YYYY-MM-DD
  title: string;
  category: ActivityCategory;
  note: string | null;
  created_at: string;    // ISO 8601
  updated_at: string;
}

export interface ActivityCreateInput {
  date: string;
  title: string;
  category: ActivityCategory;
  note?: string;
}

export interface ActivityUpdateInput {
  title?: string;
  category?: ActivityCategory;
  note?: string | null;
}

export interface Profile {
  id: string;
  email: string;
  last_login_at: string | null;
  theme_preference: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

---

## 7. Consultas Principales (capa de servicios)

### 7.1. activitiesService.fetchByMonth

async function fetchByMonth(year: number, month: number): Promise<Activity[]> {
  const start = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
  const end = format(endOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

### 7.2. activitiesService.create

async function create(input: ActivityCreateInput): Promise<Activity> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      date: input.date,
      title: input.title.trim(),
      category: input.category,
      note: input.note?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

### 7.3. activitiesService.update

async function update(id: string, input: ActivityUpdateInput): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

### 7.4. activitiesService.remove

async function remove(id: string): Promise<void> {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

### 7.5. authService.getLastLogin

async function getLastLogin(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('last_login_at')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data?.last_login_at ?? null;
}

### 7.6. authService.updateLastLogin

async function updateLastLogin(): Promise<void> {
  const { error } = await supabase.rpc('update_last_login');
  if (error) throw error;
}

### 7.7. authService.updateThemePreference

async function updateThemePreference(
  pref: 'light' | 'dark' | 'system'
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('profiles')
    .update({ theme_preference: pref })
    .eq('id', user.id);

  if (error) throw error;
}

---

## 8. Caché Local (AsyncStorage)

### 8.1. Claves utilizadas

Clave   |   Contenido   |   Formato
@kalendaria:cache:activities:YYYY-MM   |   Actividades de un mes   |   JSON array
@kalendaria:theme   |   Preferencia de tema   |   string
@kalendaria:lastSync   |   Timestamp de la última sincronización	ISO   |   string

### 8.2. Estrategia de invalidación

- Al crear/editar/eliminar una actividad → invalidar caché del mes afectado.
- Al iniciar sesión → limpiar toda la caché y recargar.
- Al cerrar sesión → limpiar toda la caché.

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

- Supabase Free tier incluye backups automáticos diarios con retención de 7 días.
- Para producción (si se escala), activar Point-in-Time Recovery (PITR) en plan Pro.
- No se implementa backup manual en el MVP; la responsabilidad recae en Supabase.

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
Rate limiting en OTP   |   ✅ (Supabase por defecto)

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

Antes de dar por bueno el backend, verificar:

□ Todas las tablas tienen RLS activo.
□ Todas las políticas RLS han sido probadas con usuarios distintos.
□ El trigger handle_new_user crea correctamente un profiles al registrarse.
□ Los CHECK constraints rechazan datos inválidos (título vacío, categoría inválida).
□ Los timestamps created_at / updated_at se actualizan correctamente.
□ El índice activities_user_date_idx se usa en queries de mes.
□ La función RPC update_last_login solo puede ejecutarla un usuario autenticado sobre su propio perfil.
□ Los tipos TypeScript generados coinciden con el esquema real.


---

# 📄 Archivo 2: `06-Implementation-Plan.md`

# Implementation Plan
## Kalendaria — App de Agenda y Calendario Personal

**Versión:** 1.0
**Fecha:** Octubre 2026
**Estado:** Aprobado
**Documentos base:** `01-PRD.md`, `02-TRD.md`, `04-UIUX-Brief.md`, `05-Backend-Schema.md`

---

## 1. Cómo usar este documento

Este plan define **la secuencia exacta** en la que se debe construir la app. Cada fase tiene:

- **Objetivo:** qué se quiere lograr.
- **Entregable:** qué debe existir al terminar la fase.
- **Tareas:** pasos concretos.
- **Criterio de "Done":** cómo verificar que está bien.

**Regla de oro para el agente de IA:** no avanzar a la siguiente fase sin completar y validar la anterior. Cada fase debe compilar y funcionar antes de continuar.

**Convención de commits:** usar Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Al terminar cada fase, hacer commit con mensaje `feat(fase-N): <descripción>`.

---

## 2. Visión General de Fases

| Fase | Nombre | Duración estimada | Bloqueantes |
|---|---|---|---|
| 0 | Setup del proyecto | 1-2 h | Ninguno |
| 1 | Configuración de Supabase | 1-2 h | Fase 0 |
| 2 | Sistema de temas y design tokens | 2-3 h | Fase 0 |
| 3 | Autenticación (registro, login, OTP) | 6-8 h | Fases 1, 2 |
| 4 | Vista de Calendario Mensual | 6-8 h | Fase 3 |
| 5 | Vista de Detalle del Día | 3-4 h | Fase 4 |
| 6 | CRUD de Actividades (crear, editar, eliminar) | 6-8 h | Fase 5 |
| 7 | Ajustes y Cierre de Sesión | 2-3 h | Fase 3 |
| 8 | Caché local y modo offline | 4-5 h | Fases 4, 6 |
| 9 | Pulido, accesibilidad y QA | 4-6 h | Todas |
| 10 | Build de producción (EAS) | 2-4 h | Fase 9 |

**Total estimado:** 40-55 horas de desarrollo efectivo.
