-- Migración: marca qué recursos de un proyecto son públicos.
--
-- Hasta ahora GET /api/proyectos/:id (la página pública /project/:id, SIN login)
-- devolvía TODO el árbol de `recurso` del proyecto, incluido cualquier archivo
-- que el equipo subiera después desde el workspace (/grupo-trabajo/:id). Eso
-- exponía nombres de archivos internos del equipo a cualquier visitante.
--
-- Con esta columna, solo los recursos creados al publicar el proyecto (galería
-- de imágenes + documento de acreditación, y las carpetas "Recursos"/"Principal"
-- que los contienen) quedan marcados es_publico = true. Lo que el equipo agregue
-- después en el workspace queda en false por defecto y NO se muestra en la
-- página pública (sigue visible para el equipo vía el endpoint de recursos, que
-- ya exige ser participante del proyecto).
--
-- Igual que 001..009: el SQL en data/buscador_proyectos.sql solo corre en un
-- volumen de Postgres nuevo. Para una base ya existente:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/010_recurso_es_publico.sql

BEGIN;

ALTER TABLE public.recurso
  ADD COLUMN IF NOT EXISTS es_publico boolean NOT NULL DEFAULT false;

-- Datos existentes: todo lo que ya estaba dentro de la carpeta "Principal" (la
-- que se crea al publicar el proyecto) se considera parte del set público
-- original, igual que las carpetas "Recursos"/"Principal" mismas. Lo que esté
-- fuera de esa carpeta (subido después desde el workspace) queda privado.
WITH raiz AS (
  SELECT id, proyecto_id FROM public.recurso
  WHERE nombre = 'Recursos' AND tipo = 'carpeta' AND padre_id IS NULL
),
principal AS (
  SELECT r.id, r.proyecto_id FROM public.recurso r
  JOIN raiz ON raiz.id = r.padre_id
  WHERE r.nombre = 'Principal' AND r.tipo = 'carpeta'
)
UPDATE public.recurso r
SET es_publico = true
WHERE r.id IN (SELECT id FROM raiz)
   OR r.id IN (SELECT id FROM principal)
   OR r.padre_id IN (SELECT id FROM principal);

COMMIT;
