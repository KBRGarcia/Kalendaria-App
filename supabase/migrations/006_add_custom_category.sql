-- 05-Backend-Schema.md §4 y §9.1.
-- Categoría personalizada: solo para actividades con category = 'otro'.
-- Migración aditiva y compatible hacia atrás: las columnas son nulables, el CHECK de
-- category no cambia y el APK 1.0.0 (que no las lee) sigue funcionando.
-- Haz `npm run db:backup` antes de ejecutarla.

ALTER TABLE public.activities
  ADD COLUMN custom_category_name text
    CHECK (
      custom_category_name IS NULL
      OR (custom_category_name = btrim(custom_category_name)
          AND char_length(custom_category_name) BETWEEN 1 AND 30)
    ),
  ADD COLUMN custom_category_color text
    CHECK (custom_category_color IS NULL OR custom_category_color ~ '^#[0-9A-Fa-f]{6}$'),
  -- Nombre y color van juntos: ambos nulos o ambos rellenos.
  ADD CONSTRAINT activities_custom_category_pair
    CHECK ((custom_category_name IS NULL) = (custom_category_color IS NULL)),
  -- Solo se personaliza la categoría 'otro'.
  ADD CONSTRAINT activities_custom_category_only_otro
    CHECK (custom_category_name IS NULL OR category = 'otro');
