-- 05-Backend-Schema.md §4 y §9.1: activities e índices.
-- gen_random_uuid() es nativo desde PostgreSQL 13. Supabase usa 15: no hace falta extensión.

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

-- Consultas del mes: usuario + rango de fechas.
CREATE INDEX activities_user_date_idx
ON public.activities(user_id, date);

CREATE INDEX activities_date_idx ON public.activities(date);
