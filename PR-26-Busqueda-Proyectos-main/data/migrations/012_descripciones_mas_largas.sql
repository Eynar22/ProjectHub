-- Migración: descripciones más largas.
--
-- empresa.descripcion         varchar(250) -> varchar(1000)
-- proyecto.descripcion_corta  varchar(250) -> varchar(500)
-- Solo se amplía el tamaño, los datos existentes no cambian.
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/012_descripciones_mas_largas.sql

BEGIN;

ALTER TABLE public.empresa ALTER COLUMN descripcion TYPE varchar(1000);
ALTER TABLE public.proyecto ALTER COLUMN descripcion_corta TYPE varchar(500);

COMMIT;
