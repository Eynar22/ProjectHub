-- Migración: sello de creación del proyecto. La tabla solo tenía fecha_inicio
-- (planificada, editable y a veces muy futura), inservible para medir el
-- crecimiento real de la plataforma. fecha_creacion es inmutable y sirve para
-- las series "altas por mes" del panel de administración.
--
-- Igual que 001..006: el SQL en data/buscador_proyectos.sql solo corre en un
-- volumen de Postgres nuevo. Para una base ya existente:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/007_proyecto_fecha_creacion.sql

BEGIN;

ALTER TABLE public.proyecto
  ADD COLUMN IF NOT EXISTS fecha_creacion timestamp without time zone DEFAULT now() NOT NULL;

-- ADD COLUMN ya rellenó todas las filas existentes con now(). Para los proyectos
-- previos cuya fecha_inicio ya pasó, esa fecha es una aproximación más honesta
-- que "ahora"; los de inicio futuro se quedan con now().
UPDATE public.proyecto
SET fecha_creacion = fecha_inicio::timestamp
WHERE fecha_inicio IS NOT NULL AND fecha_inicio::timestamp < now();

COMMIT;
