-- 05-Backend-Schema.md §3.5, §4.5 y §9.1.
-- Sin política para un comando, el rol de la API no puede usarlo.
-- profiles no tiene INSERT ni DELETE: el alta es el trigger y el borrado es CASCADE desde auth.users.
-- El dueño de la tabla (postgres) omite RLS; anon y authenticated no.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
ON public.activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
ON public.activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
ON public.activities FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
ON public.activities FOR DELETE
USING (auth.uid() = user_id);
