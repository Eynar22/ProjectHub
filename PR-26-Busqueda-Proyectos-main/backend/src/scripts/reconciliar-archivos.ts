/* ============================================================================
 * Reconciliación: archivos en disco sin fila en la tabla `archivo`.
 *
 * El backend no sirve un archivo por su sola presencia en el volumen: para
 * cada GET /api/archivos/<bucket>/AAAA/MM/<id>.<ext> exige que exista una fila
 * en `archivo` con esa ruta (ahí vive el mimetype y, para el bucket privado,
 * el permiso). Si en algún momento se restauró/reseteó la base de datos pero
 * el volumen de almacenamiento se mantuvo, esos archivos quedan huérfanos: el
 * archivo físico existe pero cualquier request da 404 (a cualquier usuario,
 * incluido superadmin).
 *
 * Este script escanea el disco y, para cada archivo cuyo nombre sea un uuid
 * válido y no tenga fila en `archivo`, la crea (mimetype por extensión, tamaño
 * real del archivo, sin dueño ni entidad — no hay forma de recuperar eso).
 * No borra ni modifica nada existente; es seguro re-ejecutarlo.
 *
 * Uso (dentro del contenedor backend, con el volumen montado y la BD accesible):
 *
 *   node dist/scripts/reconciliar-archivos.js            # aplica
 *   node dist/scripts/reconciliar-archivos.js --dry-run  # solo reporta
 * ========================================================================= */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { promises as fs } from 'fs';
import { join, sep } from 'path';
import { AppModule } from '../app.module';
import { EXT_BY_MIME, Bucket } from '../almacenamiento/almacenamiento.constants';

const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(EXT_BY_MIME).map(([mime, ext]) => [ext, mime]),
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DRY_RUN = process.argv.includes('--dry-run');

async function* caminar(dir: string): AsyncGenerator<string> {
  let entradas: import('fs').Dirent[];
  try {
    entradas = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entradas) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) {
      yield* caminar(ruta);
    } else {
      yield ruta;
    }
  }
}

async function main() {
  const log = new Logger('reconciliar-archivos');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const ds = app.get(DataSource);

  const baseDir = process.env.ALMACENAMIENTO_DIR || join(process.cwd(), 'almacenamiento_data');
  log.log(`${DRY_RUN ? '── DRY RUN ──' : '── Reconciliando ──'} base: ${baseDir}`);

  let encontrados = 0;
  let yaRegistrados = 0;
  let saltados = 0;
  let faltantes = 0;
  let insertados = 0;

  for (const bucket of ['publico', 'privado'] as Bucket[]) {
    const dirBucket = join(baseDir, bucket);
    for await (const rutaFisica of caminar(dirBucket)) {
      encontrados++;
      const nombreArchivo = rutaFisica.split(sep).pop()!;
      const punto = nombreArchivo.lastIndexOf('.');
      const id = punto === -1 ? nombreArchivo : nombreArchivo.slice(0, punto);
      const ext = punto === -1 ? '' : nombreArchivo.slice(punto + 1).toLowerCase();
      const rutaRelativa = rutaFisica.slice(baseDir.length + 1).split(sep).join('/');

      if (!UUID_RE.test(id) || !MIME_BY_EXT[ext]) {
        log.warn(`Saltado (nombre no reconocido, no se toca): ${rutaRelativa}`);
        saltados++;
        continue;
      }

      const existe = await ds.query(`SELECT 1 FROM archivo WHERE id = $1 LIMIT 1`, [id]);
      if (existe.length > 0) {
        yaRegistrados++;
        continue;
      }

      faltantes++;
      const stat = await fs.stat(rutaFisica);
      log.warn(`Falta en BD: ${rutaRelativa} (${(stat.size / 1024).toFixed(0)} KB)`);
      if (DRY_RUN) continue;

      await ds.query(
        `INSERT INTO archivo (id, bucket, ruta_relativa, mimetype, size_bytes, nombre_original, subido_por, referenciado)
         VALUES ($1, $2, $3, $4, $5, NULL, NULL, true)
         ON CONFLICT (id) DO NOTHING`,
        [id, bucket, rutaRelativa, MIME_BY_EXT[ext], stat.size],
      );
      insertados++;
    }
  }

  log.log(
    `Encontrados en disco: ${encontrados}. Ya en BD: ${yaRegistrados}. Saltados: ${saltados}. ` +
      `Faltantes: ${faltantes}. ${DRY_RUN ? 'Se insertarían' : 'Insertados'}: ${DRY_RUN ? faltantes : insertados}.`,
  );

  await app.close();
  process.exit(0);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
