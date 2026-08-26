-- Migración: códigos de recuperación de contraseña (enviados por correo)
--
-- Igual que 001/002: el SQL en data/buscador_proyectos.sql solo corre en un
-- volumen de Postgres nuevo. Para una base ya existente (dev local o
-- producción), aplicar a mano:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/003_codigo_recuperacion.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.codigo_recuperacion (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    codigo character varying(6) NOT NULL,
    fecha_expiracion timestamp without time zone NOT NULL,
    usado boolean DEFAULT false NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.codigo_recuperacion
  ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.codigo_recuperacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
  );

ALTER TABLE ONLY public.codigo_recuperacion
  ADD CONSTRAINT codigo_recuperacion_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.codigo_recuperacion
  ADD CONSTRAINT codigo_recuperacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_codigo_recuperacion_usuario ON public.codigo_recuperacion(usuario_id);

COMMIT;
