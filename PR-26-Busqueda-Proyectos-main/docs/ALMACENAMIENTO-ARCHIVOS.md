# Migración: base64 en BD → archivos en disco

Objetivo: dejar de guardar imágenes y PDF como `data:...;base64,...` en columnas
`text` de Postgres (causa de la lentitud). Pasan a ser archivos en un volumen; en
la BD solo queda la ruta (`/api/archivos/<bucket>/AAAA/MM/<uuid>.<ext>`).

Rama: `feature/almacenamiento-archivos`.

## Decisiones

| Tema | Decisión |
|---|---|
| Ubicación | Bind mount a la carpeta persistente de Dokploy (`../files/almacenamiento` → `/app/almacenamiento`). Entra en los backups de Dokploy y sobrevive a los redeploys. |
| Buckets | `publico/` (imágenes de proyecto, logos, avatares, imágenes de recursos) y `privado/` (cédulas, CV, propuestas, PDF de recursos, docs de solicitudes). Subcarpetas `AAAA/MM`. |
| Límite de uso | `ALMACENAMIENTO_MAX_BYTES` (55 GiB por defecto, ~28 % de un disco de 192 GB). Al superarlo, las subidas responden `507`. Aviso en logs al 80 / 95 %. |
| Servido | Todo por el backend. `publico` sin auth + cache de 1 año (nombre UUID no adivinable); `privado` con `AuthGuard('jwt')` + permiso. nginx solo mantiene el proxy `/api/`. |
| Permiso `privado` | superadmin o quien subió el archivo. (Ampliable a participantes del proyecto / admin de la empresa.) |
| Registro | Tabla `archivo` (dueño, tamaño, mimetype, bucket) para permisos, cuota y limpieza de huérfanos. |

## Estado — todas las fases implementadas

- **Fase 1 — Infra.** ✅ Volumen en `docker-compose.yml`, `backend/.env.example`, ignores.
- **Fase 2 — Backend.** ✅ Tabla `archivo` (`data/migrations/009_archivo.sql`), entidad, `AlmacenamientoModule`:
  - `POST /api/archivos?bucket=publico|privado` (auth) → `{ url, ... }`
  - `POST /api/archivos/registro` (sin auth, rate-limit por IP) → `{ url }` — solo para el formulario de registro
  - `GET /api/archivos/publico/:a/:m/:nombre` (sin auth, cache larga)
  - `GET /api/archivos/privado/:a/:m/:nombre` (auth + permiso)
  - `GET /api/almacenamiento/estado` (superadmin)
- **Fase 3 — Migración de datos.** ✅ `backend/src/scripts/migrar-base64-a-archivos.ts`.
  Decodifica el base64 de las 12 columnas `*_url`, lo escribe como archivo y
  reemplaza la columna por la ruta. Idempotente (solo `LIKE 'data:%'`), por lotes,
  no destructivo con las filas que fallan. `npm run migrar:archivos[:dry]`.
- **Fase 4 — Frontend + `recurso.controller`.** ✅
  - `recurso.controller` `POST /recursos/upload` usa `AlmacenamientoService` y
    devuelve `{ url, filename, mimetype, size }` (imágenes → `publico`, PDF → `privado`).
  - `config.ts` usa `/api` relativo + proxy de Vite en dev (`vite.config.mts`),
    así una `<img src="/api/archivos/...">` funciona same-origin sin helper.
  - Servicios de subida (`proyectos`, `recursos`, `solicitudes`, `auth`) suben al
    backend y guardan la `url`. `openBase64` (AppContext) abre tanto data URLs
    viejas como rutas nuevas (con `fetch` autenticado para el bucket privado).
  - `main.ts`: límite de `json()` bajado de 20 MB a 2 MB (ya no viaja base64).
  - `src/shared/utils/fileToBase64.ts` eliminado (sin usos).
- **Fase 5 — Ciclo de vida y limpieza.** ✅
  - Borrado del archivo en disco al eliminar/reemplazar:
    `recurso.service.remove` (recurso + descendientes, CTE recursiva),
    `proyecto.service` (`remove` y reemplazo de galería en `update`),
    `usuario.service` (`remove`, `updateSelf` al cambiar la foto, `deleteMembership`),
    `empresa.service.update` (reemplazo de logo / documento / galería).
  - Todos usan `eliminarPorUrlSiHuerfano`: solo borra si NINGUNA columna `*_url`
    sigue apuntando al archivo (la misma imagen de proyecto también existe como
    recurso).
  - `LimpiezaArchivosService`: red de seguridad. `setInterval` semanal (+ una
    pasada 5 min tras el arranque) que reconstruye el conjunto de ids en uso
    escaneando las 12 columnas y borra del disco los `archivo` con > 2 días sin
    referencia. Salvaguarda: si el escaneo no encuentra ninguna referencia y hay
    archivos, aborta sin borrar. Cubre lo no cableado (solicitudes rechazadas,
    registros abandonados, expulsión de participantes).

Pendiente opcional (no bloquea): simplificar los `select` manuales de los
services que hoy esconden columnas ya livianas.

---

## Pasos para desplegar en producción (Dokploy)

Todo se despliega junto (el cambio de `recurso.controller` va con su frontend).
Aún no subido a la nube.

### 1. Backup

```
# en el host de Dokploy
docker exec -t buscador_postgres pg_dump -U postgres -d buscador \
  > ~/backup_buscador_$(date +%F_%H%M).sql
```
Verificá que el archivo pese algo real (varios MB, hoy con el base64 dentro).

### 2. Variables de entorno del servicio backend en Dokploy

Agregar (Environment del servicio `backend`):

```
ALMACENAMIENTO_DIR=/app/almacenamiento
ALMACENAMIENTO_MAX_BYTES=59055800320
ALMACENAMIENTO_HOST_PATH=../files/almacenamiento
```

`59055800320` = 55 GiB. `../files/almacenamiento` cae en la carpeta persistente
de Dokploy y entra en sus backups.

### 3. Merge y deploy

1. Merge de `feature/almacenamiento-archivos` a la rama que Dokploy despliega
   (`main` / `test`, según config).
2. En Dokploy: **Deploy** del compose completo (reconstruye backend y frontend).
3. Al levantar, en los logs del backend debe aparecer:
   `Almacenamiento en /app/almacenamiento — 0.00 GB usados de 55.00 GB (0.0%)`
   y un `warn` de que falta la migración 009 (normal, se corre en el paso 4).

### 4. Migración de esquema (tabla `archivo`)

```
docker exec -i buscador_postgres psql -U postgres -d buscador \
  < data/migrations/009_archivo.sql
```
(Si el repo no está en el host, copiar el `.sql` primero o pegar su contenido en
`psql`.) Idempotente: se puede correr más de una vez.

### 5. Migración de datos (base64 → archivos)

```
docker exec -it buscador_backend sh -lc "npm run migrar:archivos:dry"
```
Revisá el resumen (cuántos migraría por tabla, cuántos “saltados”). Si pinta bien:

```
docker exec -it buscador_backend sh -lc "npm run migrar:archivos"
```
- Idempotente y reanudable.
- Las filas que fallan NO se tocan; se listan en el log para revisarlas a mano
  (el dato original sigue en el `pg_dump`).
- Al terminar imprime el uso del almacenamiento.

### 6. Verificación

- `GET https://projecthub.umaunivalle.com/api/almacenamiento/estado` con token de
  superadmin → debe devolver `usado` > 0 y el conteo de archivos.
- En la app (tu pantalla):
  - Explore / dashboards: las portadas de proyecto y logos se ven.
  - Avatares de usuarios se ven.
  - Workspace → Recursos: abrir una imagen y un PDF.
  - Solicitudes: abrir un CV / propuesta.
  - Perfil: cambiar la foto y recargar.
  - Registro de empresa nueva (en incógnito): subir logo + documentos y que el
    alta se complete.
- En Network, las imágenes cargan desde `/api/archivos/publico/...` (200, y
  `cache-control: public, max-age=31536000`).

### 7. Post-deploy

- El tamaño de la BD debería bajar bastante tras un `VACUUM FULL` (opcional, con
  la app en mantenimiento):
  `docker exec -i buscador_postgres psql -U postgres -d buscador -c "VACUUM FULL;"`
- El barrido semanal de huérfanos corre solo; la primera pasada es ~5 min después
  de cada arranque del backend.

### Rollback

- Restaurar la BD del `pg_dump` del paso 1 y volver a desplegar el commit
  anterior. Los archivos escritos en el volumen quedan huérfanos pero no molestan
  (se pueden borrar a mano: `rm -rf` del contenido de `../files/almacenamiento`).
