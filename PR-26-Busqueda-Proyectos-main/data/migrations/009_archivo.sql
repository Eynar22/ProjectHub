-- Migración: registro de archivos guardados en disco.
--
-- A partir de aquí las imágenes y PDF NO se guardan como base64 en columnas text,
-- sino como archivos en el volumen de almacenamiento; en la BD solo queda la ruta
-- (/api/archivos/<bucket>/AAAA/MM/<uuid>.<ext>). Esta tabla es el índice de esos
-- archivos: permisos del bucket privado, control de cuota y detección de huérfanos.
--
-- Igual que 001..008: el SQL en data/buscador_proyectos.sql solo corre en un
-- volumen de Postgres nuevo. Para una base ya existente:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/009_archivo.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.archivo (
  id              uuid PRIMARY KEY,
  bucket          varchar(10) NOT NULL,            -- 'publico' | 'privado'
  ruta_relativa   text NOT NULL,                   -- 'publico/2026/03/<id>.jpg'
  mimetype        varchar(100) NOT NULL,
  size_bytes      bigint NOT NULL,
  nombre_original text,
  subido_por      integer,                         -- usuario.id (SET NULL al borrar el usuario)
  entidad_tipo    varchar(40),                     -- 'proyecto_imagen' | 'usuario_documento' | ... (se completa en Fase 4)
  entidad_id      integer,
  referenciado    boolean NOT NULL DEFAULT false,  -- true cuando alguna columna *_url lo apunta
  creado_en       timestamp without time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.archivo OWNER TO postgres;

DO $$
BEGIN
  ALTER TABLE public.archivo
    ADD CONSTRAINT archivo_subido_por_fkey
    FOREIGN KEY (subido_por) REFERENCES public.usuario(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS archivo_referenciado_creado_idx
  ON public.archivo (referenciado, creado_en);

COMMIT;
