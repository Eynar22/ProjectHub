# Migración: base64 en BD → archivos en disco

Objetivo: dejar de guardar imágenes y PDF como `data:...;base64,...` en columnas
`text` de Postgres. Pasan a ser archivos en un volumen; en la BD solo queda la
ruta (`/api/archivos/<bucket>/AAAA/MM/<uuid>.<ext>`).

## Decisiones

| Tema | Decisión |
|---|---|
| Ubicación | Bind mount a la carpeta persistente de Dokploy (`../files/almacenamiento` → `/app/almacenamiento`). Entra en los backups de Dokploy. |
| Buckets | `publico/` (imágenes de proyecto, logos, avatares) y `privado/` (cédulas, CV, propuestas, docs de solicitudes). Subcarpetas `AAAA/MM`. |
| Límite de uso | `ALMACENAMIENTO_MAX_BYTES` (55 GiB por defecto, ~28 % de un disco de 192 GB). Al superarlo, las subidas responden `507`. Aviso en logs al 80 / 95 %. |
| Servido | Todo por el backend. `publico` sin auth + cache de 1 año; `privado` con `AuthGuard('jwt')` + permiso. nginx solo mantiene el proxy `/api/`. |
| Permiso `privado` | Fase 2: superadmin o quien subió el archivo. Fase 4: se amplía a participantes del proyecto / admin de la empresa. |
| Registro | Tabla `archivo` (dueño, tamaño, mimetype, bucket) para permisos, cuota y limpieza de huérfanos. |

## Fases

- **Fase 1 — Infra.** ✅ Volumen en `docker-compose.yml`, `backend/.env.example`, ignores.
- **Fase 2 — Backend.** ✅ Tabla `archivo` (`data/migrations/009_archivo.sql`), entidad, `AlmacenamientoModule`:
  - `POST /api/archivos?bucket=publico|privado` (auth) → `{ url, ... }`
  - `GET /api/archivos/publico/:a/:m/:nombre` (sin auth, cache larga)
  - `GET /api/archivos/privado/:a/:m/:nombre` (auth + permiso)
  - `GET /api/almacenamiento/estado` (superadmin)
- **Fase 3 — Migración de datos.** ✅ `backend/src/scripts/migrar-base64-a-archivos.ts`.
  Decodifica el base64 de todas las columnas `*_url`, lo escribe como archivo y
  reemplaza la columna por la ruta. Idempotente (solo toca `LIKE 'data:%'`), por
  lotes. `npm run migrar:archivos:dry` para simular, `npm run migrar:archivos`
  para aplicar. Correr dentro del contenedor backend tras un `pg_dump`.
  Columnas cubiertas: `proyecto_imagen.url`, `empresa_imagen.url`,
  `empresa.logo_url`, `empresa.documento_url`, `usuario.foto_url`,
  `usuario.documento_url`, `proyecto.documento_url`, `recurso.url`,
  `solicitud_proyecto.propuesta_url`, `solicitud_proyecto.cv_url`,
  `solicitud_membresia.documento_url`, `mensaje.archivo_url`.
- **Fase 4 — Frontend + endpoints de entidades.** ⏳ `endpoints.ts` + servicios suben a
  `/api/archivos` y guardan la `url`. Helper `resolveAssetUrl()`. `recurso.controller`
  deja de devolver base64. Componentes de imagen/PDF pasan por el helper. Bajar el
  límite de `json()` en `main.ts`.
- **Fase 5 — Ciclo de vida y limpieza.** ⏳ Borrado de archivos al reemplazar/eliminar
  entidades; job semanal (`@nestjs/schedule`) de huérfanos; simplificar los `select`
  manuales que hoy esconden columnas base64.

## Pasos en Dokploy (al desplegar Fase 1+2)

1. `pg_dump` de la base actual (pendiente #8 de `CAMBIOS-PRODUCCION.md`).
2. En las env vars del servicio **backend** de Dokploy, agregar:
   - `ALMACENAMIENTO_DIR=/app/almacenamiento`
   - `ALMACENAMIENTO_MAX_BYTES=59055800320`
   - `ALMACENAMIENTO_HOST_PATH=../files/almacenamiento`
3. Deploy del compose. Verificar en logs la línea `Almacenamiento en /app/almacenamiento — ...`.
4. Aplicar la migración:
   `docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/009_archivo.sql`
5. Smoke test: `curl` con token a `POST /api/archivos?bucket=publico` con una imagen;
   luego `GET` a la `url` devuelta.

## Fase 3 — migrar el base64 ya guardado

Dentro del contenedor backend (BD accesible + volumen montado), tras el `pg_dump`:

```
docker exec -it buscador_backend sh -lc "npm run migrar:archivos:dry"   # simula, cuenta
docker exec -it buscador_backend sh -lc "npm run migrar:archivos"        # aplica
```

- Idempotente: si se corta, se vuelve a lanzar y reanuda.
- Las filas que fallan o cuyo `data:` no se pudo decodificar NO se tocan (su
  valor original queda intacto); solo se listan en el log para revisarlas a mano.
- Al terminar imprime el uso del almacenamiento y sale con código 1 si hubo errores.
