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

## Desplegar en producción

Runbook paso a paso (backup, env vars, deploy, migraciones, verificación,
rollback): **[`DESPLIEGUE-ALMACENAMIENTO-PRODUCCION.md`](./DESPLIEGUE-ALMACENAMIENTO-PRODUCCION.md)**.
