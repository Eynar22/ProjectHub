-- Migración: la descripción de la empresa pasa a text (sin tope), igual que
-- proyecto.descripcion_completa. proyecto.descripcion_corta queda en varchar(500)
-- (migración 012). Solo cambia el tipo; los datos existentes no se tocan.
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/013_empresa_descripcion_text.sql

BEGIN;

ALTER TABLE public.empresa ALTER COLUMN descripcion TYPE text;

COMMIT;
