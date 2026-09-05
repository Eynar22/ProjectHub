# Runbook — desplegar la migración base64 → archivos en disco

Rama: `feature/almacenamiento-archivos`. Todo se despliega junto (el cambio de
`recurso.controller` va con su frontend). Contexto y decisiones de diseño en
[`ALMACENAMIENTO-ARCHIVOS.md`](./ALMACENAMIENTO-ARCHIVOS.md).

> Reservá ~20 min. Los pasos 4 y 5 (migraciones) se corren **una vez**, después
> del deploy. Son idempotentes: si algo se corta, se vuelven a lanzar.

---

## 0. Pre-requisitos

- Acceso SSH al host de Dokploy (para `docker exec` y el `pg_dump`).
- El repo actualizado en el host, o los `.sql` a mano para pegarlos en `psql`.
- Nombres de contenedor: `buscador_postgres`, `buscador_backend`, `buscador_frontend`.

---

## 1. Backup de la base de datos

```bash
docker exec -t buscador_postgres pg_dump -U postgres -d buscador \
  > ~/backup_buscador_$(date +%F_%H%M).sql

ls -lh ~/backup_buscador_*.sql
```

Confirmá que pese **varios MB** (hoy lleva el base64 embebido). Si pesa pocos KB,
algo salió mal: **no sigas**.

---

## 2. Variables de entorno del servicio `backend` en Dokploy

Panel de Dokploy → servicio **backend** → Environment → agregar:

```
ALMACENAMIENTO_DIR=/app/almacenamiento
ALMACENAMIENTO_MAX_BYTES=59055800320
ALMACENAMIENTO_HOST_PATH=../files/almacenamiento
```

| Var | Qué es |
|---|---|
| `ALMACENAMIENTO_DIR` | Carpeta dentro del contenedor. Debe coincidir con el destino del volumen en `docker-compose.yml`. |
| `ALMACENAMIENTO_MAX_BYTES` | `59055800320` = 55 GiB (~29 % de un disco de 192 GB). Al superarlo, las subidas responden `507`. |
| `ALMACENAMIENTO_HOST_PATH` | Ruta en el host que se monta como volumen. `../files/almacenamiento` cae en la carpeta persistente de Dokploy y entra en sus backups. |

---

## 3. Merge y deploy

1. Merge de `feature/almacenamiento-archivos` → la rama que despliega Dokploy
   (normalmente `main`).
2. Dokploy → **Deploy** del compose completo (reconstruye backend **y** frontend).
3. Cuando levante, en los logs del backend debe aparecer:

   ```
   Almacenamiento en /app/almacenamiento — 0.00 GB usados de 55.00 GB (0.0%)
   ```

   y un `warn` de que no pudo leer el uso / falta la migración 009 → **normal**,
   se corrige en el paso 4.

---

## 4. Migraciones de esquema — tablas `archivo` y `recurso.es_publico`

```bash
docker exec -i buscador_postgres psql -U postgres -d buscador \
  < data/migrations/009_archivo.sql

docker exec -i buscador_postgres psql -U postgres -d buscador \
  < data/migrations/010_recurso_es_publico.sql
```

Si el repo no está en el host: copiá los archivos primero (`docker cp`) o abrí
`psql` y pegá el contenido. Ambas son idempotentes.

`010` agrega `recurso.es_publico` y marca como público lo que ya estaba dentro
de la carpeta "Principal" de cada proyecto (lo creado al publicarlo); lo que el
equipo subió después desde el workspace queda en `false`. Sin este paso, la
página pública de cada proyecto deja de mostrar TODOS sus documentos/imágenes
(porque el filtro nuevo del backend no encuentra ninguno marcado público).

Comprobar:

```bash
docker exec -it buscador_postgres psql -U postgres -d buscador -c "\d archivo"
docker exec -it buscador_postgres psql -U postgres -d buscador \
  -c "SELECT proyecto_id, count(*) FILTER (WHERE es_publico) AS publicos, count(*) AS total FROM recurso GROUP BY proyecto_id ORDER BY proyecto_id;"
```

---

## 5. Migración de datos — base64 → archivos

Primero en seco (no escribe nada, solo cuenta):

```bash
docker exec -it buscador_backend sh -lc "npm run migrar:archivos:dry"
```

Revisá el resumen por tabla (`migrados`, `saltados`, `errores`). Si pinta bien:

```bash
docker exec -it buscador_backend sh -lc "npm run migrar:archivos"
```

- Idempotente y reanudable (solo toca filas `LIKE 'data:%'`).
- Las filas que fallan **no se tocan**; se listan en el log para revisarlas a
  mano (el dato original sigue en el `pg_dump` del paso 1).
- Al terminar imprime el uso del almacenamiento y sale con código 1 si hubo
  errores.

Columnas que migra: `proyecto_imagen.url`, `empresa_imagen.url`,
`empresa.logo_url`, `empresa.documento_url`, `usuario.foto_url`,
`usuario.documento_url`, `proyecto.documento_url`, `recurso.url`,
`solicitud_proyecto.propuesta_url`, `solicitud_proyecto.cv_url`,
`solicitud_membresia.documento_url`, `mensaje.archivo_url`.

---

## 6. Verificación

**API**

```bash
# token de superadmin
curl -s https://projecthub.umaunivalle.com/api/almacenamiento/estado \
  -H "Authorization: Bearer <TOKEN>" | jq
# -> { usado > 0, archivos > 0, porcentaje, ... }
```

**En la app (tu pantalla, no capturas mías):**

- [ ] Explore / dashboards: portadas de proyecto y logos de empresa se ven.
- [ ] Avatares de usuarios se ven.
- [ ] Workspace → Recursos: abrir una imagen y un PDF.
- [ ] Solicitudes de un proyecto: abrir un CV / propuesta.
- [ ] Perfil: cambiar la foto, guardar, recargar.
- [ ] Registro de empresa nueva (ventana de incógnito): subir logo + documentos y
      que el alta se complete sin error.
- [ ] En Network, las imágenes cargan desde `/api/archivos/publico/...` con
      `cache-control: public, max-age=31536000, immutable`.
- [ ] Un documento privado (`/api/archivos/privado/...`) abierto directo en el
      navegador (sin sesión) da 401/403; desde la app abre bien.
- [ ] El dueño de un proyecto puede abrir el CV/propuesta de un postulante (no
      solo el propio postulante). El admin de una empresa puede abrir el
      documento de un empleado que pide unirse.
- [ ] Al hacer clic en un PDF: aparece un toast "Abriendo documento…" y se abre
      una pestaña nueva (no hay que adivinar si el clic funcionó).
- [ ] En incógnito, `/project/:id` de un proyecto con archivos agregados
      después desde el workspace: en "Documentos y recursos" **solo** aparecen
      la galería y el documento originales — nada de lo subido después por el
      equipo. Desde el workspace del mismo proyecto (con sesión de un
      participante), esos archivos sí aparecen.

---

## 7. Post-deploy (opcional)

Recuperar el espacio en la BD (la app puede seguir arriba, pero mejor en un
momento de poco tráfico):

```bash
docker exec -i buscador_postgres psql -U postgres -d buscador -c "VACUUM FULL;"
```

El barrido semanal de huérfanos corre solo dentro del backend: primera pasada
~5 min después de cada arranque, luego cada 7 días. Borra del disco los archivos
sin ninguna referencia en las columnas `*_url` con > 2 días de antigüedad.

---

## Rollback

1. Redesplegar en Dokploy el commit anterior a la rama.
2. Restaurar la BD:

   ```bash
   cat ~/backup_buscador_<fecha>.sql | docker exec -i buscador_postgres \
     psql -U postgres -d buscador
   ```

3. Los archivos que hayan quedado en el volumen no rompen nada. Para limpiar:
   `rm -rf` del contenido de `../files/almacenamiento` en el host.

---

## Problemas frecuentes

| Síntoma | Causa / arreglo |
|---|---|
| Las imágenes nuevas no cargan (404 en `/api/archivos/...`) | nginx no está proxyando `/api/` a este backend, o el deploy del frontend no se rehizo. Revisar `nginx.conf` y redeployar el frontend. |
| Subidas responden `507` | Se llegó a `ALMACENAMIENTO_MAX_BYTES`. Subir el valor o liberar espacio. |
| El backend loguea "falta la migración 009_archivo.sql" en cada arranque | No se corrió el paso 4. |
| `migrar:archivos` reporta muchos `errores` | Ver el log: suele ser un `data:` corrupto o un mimetype no soportado. Esas filas quedan intactas; revisarlas contra el `pg_dump`. |
| La BD no bajó de tamaño tras migrar | Falta el `VACUUM FULL` del paso 7. |
