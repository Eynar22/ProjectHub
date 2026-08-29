-- Migración: documento adjunto a la propuesta de solución. Al postular a un
-- proyecto, además del texto de la propuesta y del CV, el postulante puede
-- adjuntar (opcional) un documento de respaldo de su propuesta (PDF/imagen en
-- base64), igual que cv_url.
--
-- Igual que 001..007: el SQL en data/buscador_proyectos.sql solo corre en un
-- volumen de Postgres nuevo. Para una base ya existente:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/008_solicitud_proyecto_propuesta_url.sql

BEGIN;

ALTER TABLE public.solicitud_proyecto
  ADD COLUMN IF NOT EXISTS propuesta_url text;

COMMIT;
