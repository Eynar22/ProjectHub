-- Migración: logo, galería de imágenes y enlaces para empresa
--
-- El SQL en data/buscador_proyectos.sql solo se ejecuta la primera vez que
-- Postgres crea su volumen (docker-entrypoint-initdb.d). Cualquier base de
-- datos que ya exista (dev local con volumen creado, o producción) necesita
-- este script aplicado manualmente:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/001_empresa_logo_imagenes_enlaces.sql
--
-- o, para producción, apuntando psql directo a DATABASE_URL.

BEGIN;

ALTER TABLE public.empresa
  ADD COLUMN IF NOT EXISTS logo_url text;

CREATE TABLE IF NOT EXISTS public.empresa_imagen (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    url text NOT NULL
);

ALTER TABLE public.empresa_imagen
  ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.empresa_imagen_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
  );

ALTER TABLE ONLY public.empresa_imagen
  ADD CONSTRAINT empresa_imagen_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.empresa_imagen
  ADD CONSTRAINT empresa_imagen_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.empresa_enlace (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    url text NOT NULL,
    nombre character varying(100)
);

ALTER TABLE public.empresa_enlace
  ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.empresa_enlace_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
  );

ALTER TABLE ONLY public.empresa_enlace
  ADD CONSTRAINT empresa_enlace_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.empresa_enlace
  ADD CONSTRAINT empresa_enlace_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;

COMMIT;
