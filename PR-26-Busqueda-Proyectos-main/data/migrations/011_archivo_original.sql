-- Migración: foto original de cada imagen recortada.
--
-- El editor de fotos sube la versión recortada (la que va a la columna *_url) y
-- también la original completa. archivo.original_id enlaza la recortada con su
-- original, para que "Ajustar" vuelva a partir de la foto entera y para que la
-- limpieza de huérfanos no borre originales de fotos en uso.
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/011_archivo_original.sql

BEGIN;

ALTER TABLE public.archivo ADD COLUMN IF NOT EXISTS original_id uuid;

DO $$
BEGIN
  ALTER TABLE public.archivo
    ADD CONSTRAINT archivo_original_id_fkey
    FOREIGN KEY (original_id) REFERENCES public.archivo(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
