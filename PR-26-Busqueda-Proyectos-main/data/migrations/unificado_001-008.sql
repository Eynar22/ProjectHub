-- ============================================================================
-- unificado_001-008.sql · Migraciones 001 a 008 en un solo script
--
-- Qué es: todos los cambios de esquema que están sueltos en
--   data/migrations/001_*.sql ... 008_*.sql
-- juntos, para aplicarlos de una sola vez en el terminal de la base de Dokploy.
--
-- Es IDEMPOTENTE: se puede correr varias veces sin error. Cada cambio se aplica
-- solo si falta. Los "backfill" de datos de 004 y 007 corren únicamente la
-- primera vez que se crea su columna.
--
-- Todo va en UNA sola transacción: si algo falla, no queda nada a medias.
--
-- NO reemplaza a data/buscador_proyectos.sql (esquema base). Se aplica DESPUÉS,
-- sobre una base que ya tiene empresa, usuario, proyecto, solicitud_proyecto...
--
-- Uso (elegí uno):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f unificado_001-008.sql
--   docker exec -i <contenedor_postgres> psql -U postgres -d buscador -v ON_ERROR_STOP=1 < unificado_001-008.sql
--   o pegar este contenido en la consola SQL de Dokploy.
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 001 · empresa: logo, galería de imágenes y enlaces
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.empresa ADD COLUMN IF NOT EXISTS logo_url text;

CREATE TABLE IF NOT EXISTS public.empresa_imagen (
    id          integer NOT NULL,
    empresa_id  integer NOT NULL,
    url         text    NOT NULL
);

CREATE TABLE IF NOT EXISTS public.empresa_enlace (
    id          integer NOT NULL,
    empresa_id  integer NOT NULL,
    url         text    NOT NULL,
    nombre      character varying(100)
);

DO $$
BEGIN
  -- empresa_imagen.id -> IDENTITY (+ ajustar la secuencia si ya hubiera filas)
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.empresa_imagen'::regclass
      AND attname = 'id' AND attidentity <> '' AND NOT attisdropped
  ) THEN
    ALTER TABLE public.empresa_imagen ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
    PERFORM setval(
      pg_get_serial_sequence('public.empresa_imagen', 'id'),
      COALESCE((SELECT MAX(id) FROM public.empresa_imagen), 0) + 1,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'empresa_imagen_pkey'
                   AND conrelid = 'public.empresa_imagen'::regclass) THEN
    ALTER TABLE public.empresa_imagen ADD CONSTRAINT empresa_imagen_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'empresa_imagen_empresa_id_fkey'
                   AND conrelid = 'public.empresa_imagen'::regclass) THEN
    ALTER TABLE public.empresa_imagen ADD CONSTRAINT empresa_imagen_empresa_id_fkey
      FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;
  END IF;

  -- empresa_enlace.id -> IDENTITY
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.empresa_enlace'::regclass
      AND attname = 'id' AND attidentity <> '' AND NOT attisdropped
  ) THEN
    ALTER TABLE public.empresa_enlace ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
    PERFORM setval(
      pg_get_serial_sequence('public.empresa_enlace', 'id'),
      COALESCE((SELECT MAX(id) FROM public.empresa_enlace), 0) + 1,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'empresa_enlace_pkey'
                   AND conrelid = 'public.empresa_enlace'::regclass) THEN
    ALTER TABLE public.empresa_enlace ADD CONSTRAINT empresa_enlace_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'empresa_enlace_empresa_id_fkey'
                   AND conrelid = 'public.empresa_enlace'::regclass) THEN
    ALTER TABLE public.empresa_enlace ADD CONSTRAINT empresa_enlace_empresa_id_fkey
      FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 002 · usuario: foto de perfil
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS foto_url text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 003 · códigos de recuperación de contraseña (enviados por correo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.codigo_recuperacion (
    id                integer NOT NULL,
    usuario_id        integer NOT NULL,
    codigo            character varying(6) NOT NULL,
    fecha_expiracion  timestamp without time zone NOT NULL,
    usado             boolean DEFAULT false NOT NULL,
    fecha_creacion    timestamp without time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.codigo_recuperacion'::regclass
      AND attname = 'id' AND attidentity <> '' AND NOT attisdropped
  ) THEN
    ALTER TABLE public.codigo_recuperacion ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
    PERFORM setval(
      pg_get_serial_sequence('public.codigo_recuperacion', 'id'),
      COALESCE((SELECT MAX(id) FROM public.codigo_recuperacion), 0) + 1,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'codigo_recuperacion_pkey'
                   AND conrelid = 'public.codigo_recuperacion'::regclass) THEN
    ALTER TABLE public.codigo_recuperacion ADD CONSTRAINT codigo_recuperacion_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'codigo_recuperacion_usuario_id_fkey'
                   AND conrelid = 'public.codigo_recuperacion'::regclass) THEN
    ALTER TABLE public.codigo_recuperacion ADD CONSTRAINT codigo_recuperacion_usuario_id_fkey
      FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_codigo_recuperacion_usuario
  ON public.codigo_recuperacion (usuario_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 004 · usuario: onboarding del administrador + contraseña temporal obligatoria
--        El backfill (marcar como onboarding hecho a los usuarios ya existentes)
--        corre SOLO la primera vez que se crea la columna.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuario'
      AND column_name = 'onboarding_completado'
  ) THEN
    ALTER TABLE public.usuario ADD COLUMN onboarding_completado boolean DEFAULT false NOT NULL;
    UPDATE public.usuario SET onboarding_completado = true;
  END IF;
END $$;

ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS debe_cambiar_password boolean DEFAULT false NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 005 · proyecto.problema + postulación de independientes (propuesta + CV)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.proyecto           ADD COLUMN IF NOT EXISTS problema  text;
ALTER TABLE public.solicitud_proyecto ADD COLUMN IF NOT EXISTS propuesta text;
ALTER TABLE public.solicitud_proyecto ADD COLUMN IF NOT EXISTS cv_url    text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 006 · proyecto.ods  (ids de ODS 1..17 en JSON sobre columna text)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.proyecto ADD COLUMN IF NOT EXISTS ods text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 007 · proyecto.fecha_creacion (sello inmutable de alta)
--        Backfill de proyectos previos con fecha_inicio ya pasada: solo la
--        primera vez que se crea la columna.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proyecto'
      AND column_name = 'fecha_creacion'
  ) THEN
    ALTER TABLE public.proyecto
      ADD COLUMN fecha_creacion timestamp without time zone DEFAULT now() NOT NULL;
    UPDATE public.proyecto
       SET fecha_creacion = fecha_inicio::timestamp
     WHERE fecha_inicio IS NOT NULL
       AND fecha_inicio::timestamp < now();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 008 · solicitud_proyecto.propuesta_url (documento de respaldo de la propuesta)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.solicitud_proyecto ADD COLUMN IF NOT EXISTS propuesta_url text;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'unificado_001-008: migraciones 001 a 008 aplicadas / verificadas OK.';
END $$;
