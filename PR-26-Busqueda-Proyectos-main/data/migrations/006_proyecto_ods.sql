-- Migración: ODS (Objetivos de Desarrollo Sostenible) a los que aporta un
-- proyecto. Se eligen al crear el proyecto (varios posibles) y el landing
-- muestra cuántos proyectos aportan a cada ODS.
--
-- Igual que 001..005: el SQL en data/buscador_proyectos.sql solo corre en un
-- volumen de Postgres nuevo. Para una base ya existente (dev local o
-- producción), aplicar a mano:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/006_proyecto_ods.sql

BEGIN;

-- Lista de ids de ODS (1..17) en formato JSON, p. ej. '[7,11,13]'. Se mapea
-- con el tipo 'simple-json' de TypeORM sobre una columna text. Nullable por
-- los proyectos creados antes de este campo.
ALTER TABLE public.proyecto
  ADD COLUMN IF NOT EXISTS ods text;

COMMIT;
