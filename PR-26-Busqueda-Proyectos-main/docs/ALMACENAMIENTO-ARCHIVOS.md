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
- **Fase 4 — Frontend + `recurso.controller`.** ✅ (flujos autenticados)
  - `recurso.controller` `POST /recursos/upload` usa `AlmacenamientoService` y
    devuelve `{ url, filename, mimetype, size }` (imágenes → `publico`, PDF → `privado`).
    **Este cambio de backend se despliega junto con el frontend de esta fase.**
  - Frontend: `config.ts` usa `/api` relativo + proxy de Vite en dev
    (`vite.config.mts`), así una `<img src="/api/archivos/...">` funciona
    same-origin sin helper. Servicios de subida (`proyectos`, `recursos`,
    `solicitudes`) devuelven la `url`. `openBase64` (AppContext) abre tanto
    data URLs viejas como rutas nuevas (con `fetch` autenticado para el bucket
    privado).
  - **Pendiente 4b:** el registro (`features/auth/services/auth.service.ts`) sigue
    mandando base64 porque ocurre sin sesión; necesita un endpoint de subida
    público con rate-limit. Poco frecuente; la Fase 3 lo migra igual.
  - Pendiente: bajar el límite de `json()` en `main.ts` (va con Fase 5).
- **Fase 5 — Ciclo de vida y limpieza.** ✅ (parcial)
  - `recurso.service.remove`: borra del disco el archivo del recurso y de todos
    sus descendientes (CTE recursiva) al eliminarlo.
  - `LimpiezaArchivosService`: red de seguridad. `setInterval` semanal (+ una
    pasada 5 min tras el arranque) que reconstruye el conjunto de ids en uso
    escaneando las 12 columnas `*_url` y borra del disco los `archivo` con > 2
    días sin referencia. Salvaguarda: si el escaneo no encuentra ninguna
    referencia y hay archivos, aborta sin borrar.
  - **Pendiente 5b:** hooks de borrado explícito en `proyecto` / `usuario` /
    `empresa` / solicitudes (mientras tanto los cubre la limpieza semanal);
    simplificar los `select` manuales que esconden columnas ya livianas; bajar
    `json({ limit })` en `main.ts` (atado a Fase 4b: el registro aún manda base64).

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
