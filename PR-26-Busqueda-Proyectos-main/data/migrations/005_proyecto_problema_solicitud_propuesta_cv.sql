-- Migración: campo "problema" del proyecto y postulación de usuarios
-- independientes (propuesta de solución + CV) en las solicitudes de proyecto.
--
-- Igual que 001/002/003/004: el SQL en data/buscador_proyectos.sql solo corre en
-- un volumen de Postgres nuevo. Para una base ya existente (dev local o
-- producción), aplicar a mano:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/005_proyecto_problema_solicitud_propuesta_cv.sql

BEGIN;

-- Problema que el proyecto busca resolver. Obligatorio en el formulario de
-- creación y en el wizard; se muestra en el detalle público. Nullable en BD por
-- los proyectos creados antes de este campo.
ALTER TABLE public.proyecto
  ADD COLUMN IF NOT EXISTS problema text;

-- Postulación de un usuario independiente (sin empresa): su propuesta de
-- solución al problema del proyecto y su CV en base64. Nullable porque las
-- solicitudes de usuarios con empresa solo llevan "mensaje".
ALTER TABLE public.solicitud_proyecto
  ADD COLUMN IF NOT EXISTS propuesta text;

ALTER TABLE public.solicitud_proyecto
  ADD COLUMN IF NOT EXISTS cv_url text;

COMMIT;
