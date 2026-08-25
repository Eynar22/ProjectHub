-- Migración: foto de perfil para usuario
--
-- Igual que 001: el SQL en data/buscador_proyectos.sql solo corre en un
-- volumen de Postgres nuevo. Para una base ya existente (dev local o
-- producción), aplicar a mano:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/002_usuario_foto_perfil.sql

BEGIN;

ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS foto_url text;

COMMIT;
