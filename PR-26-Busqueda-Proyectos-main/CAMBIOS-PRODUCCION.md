# Resumen de cambios — incidente 502/404 en producción (2026-08-04)

## Cambios en código (ya en git)

| # | Commit | Archivo | Qué se cambió | Por qué |
|---|---|---|---|---|
| 1 | `3e486e1` | `docker-compose.yml` | `CORS_ORIGINS`: `umauniville.com` → `umaunivalle.com` | Typo — con el dominio malo, el navegador bloquearía el login por CORS aunque el backend funcionara. |
| 2 | `873703a` | `nginx.conf` | `http://backend:3000` → `http://buscador_backend:3000` | El nombre genérico `backend` resolvía a una IP fantasma (colisión con la red interna de Dokploy). Se usa el `container_name` único en su lugar. |
| 3 | `ddeb114` | `nginx.conf` | `proxy_pass $backend_upstream/api/;` → `proxy_pass $backend_upstream$request_uri;` | Con variables en `proxy_pass`, nginx no combina el resto de la URL — todas las rutas llegaban al backend como literalmente `/api/`, nunca `/api/empresas` ni `/api/proyectos`. Causaba el 404 `Cannot GET /api/`. |
| 4 | `3e486e1` | `.dockerignore` (nuevo, raíz y `backend/`) | Excluye `.env`, `node_modules`, `dist`, `.git` del build | Evita hornear credenciales locales dentro de la imagen de producción. |
| 5 | `3e486e1` | `.gitignore` | Agregado `.claude/` | Para no versionar esa carpeta. |

**Estado:** #1, #4 y #5 ya deberían estar activos desde el redeploy anterior. #2 y #3 (los de `nginx.conf`) necesitan un **"Deploy"** nuevo en Dokploy — se hornean dentro de la imagen del frontend, así que requieren reconstruirla.

---

## Pendiente — configuración en Dokploy/servidor (no es código)

| # | Qué | Por qué importa |
|---|---|---|
| 6 | **`DATABASE_URL` en las env vars del backend en Dokploy** — actualmente tiene `postgresql://postgres:12345@localhost:5435/buscador` (valor de entorno local). Debe ser `postgresql://postgres:12345@postgres:5432/buscador` | Con el valor actual, el backend no puede conectar a Postgres dentro del contenedor de producción. Corregir **antes** del próximo redeploy. |
| 7 | **Secretos hardcodeados y commiteados en `docker-compose.yml`** (`POSTGRES_PASSWORD: 12345`, `JWT_SECRET=super_secret_key_123`) | Están en texto plano en un archivo versionado en git — riesgo de seguridad en producción. Mover a env vars de Dokploy en vez del yml. |
| 8 | **Backup de la base de datos** | No hay uno conocido. Sacar un `pg_dump` antes de seguir haciendo cambios en producción. |

## Siguiente paso inmediato

1. Corregir el punto **#6** (`DATABASE_URL`) en Dokploy.
2. Darle **Deploy** al compose completo.
3. Probar: `curl -i https://projecthub.umaunivalle.com/api/empresas`
