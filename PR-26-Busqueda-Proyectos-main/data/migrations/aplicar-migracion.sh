#!/bin/sh
# Aplica una migración a la base de producción (Dokploy) o local.
# Antes de migrar saca un respaldo (pg_dump) en ./respaldos.
#
# Uso, en el servidor (SSH) desde la carpeta del proyecto, o en local:
#   sh data/migrations/aplicar-migracion.sh 012_descripciones_mas_largas.sql
#
# Variables opcionales: CONTENEDOR (buscador_postgres), DB_USER (postgres), DB_NAME (buscador).

set -e

MIGRACION="$1"
CONTENEDOR="${CONTENEDOR:-buscador_postgres}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-buscador}"

if [ -z "$MIGRACION" ]; then
  echo "Uso: sh $0 <archivo.sql>   (ej. 012_descripciones_mas_largas.sql)"
  exit 1
fi

# ./data está montado en /docker-entrypoint-initdb.d dentro del contenedor.
RUTA="/docker-entrypoint-initdb.d/migrations/$(basename "$MIGRACION")"

if ! docker exec "$CONTENEDOR" test -f "$RUTA"; then
  echo "No existe $RUTA dentro de $CONTENEDOR. ¿Hiciste Deploy con el código nuevo?"
  exit 1
fi

mkdir -p respaldos
RESPALDO="respaldos/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
echo "Respaldando la base en $RESPALDO ..."
docker exec "$CONTENEDOR" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$RESPALDO"

echo "Aplicando $RUTA ..."
docker exec "$CONTENEDOR" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$RUTA"

echo "Listo."
