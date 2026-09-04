/* ============================================================================
 * Fase 3 — Migración de datos: base64 en BD -> archivos en disco.
 *
 * Recorre todas las columnas *_url que hoy guardan `data:...;base64,...`,
 * escribe cada valor como archivo en el volumen de almacenamiento y reemplaza
 * la columna por la ruta `/api/archivos/<bucket>/AAAA/MM/<uuid>.<ext>`.
 *
 * - Idempotente: solo toca filas con valor `LIKE 'data:%'`. Se puede re-ejecutar
 *   sin duplicar (una corrida interrumpida se reanuda sola).
 * - Procesa en lotes y una columna a la vez para no cargar todo en memoria.
 *
 * Uso (dentro del contenedor backend, con el volumen montado y la BD accesible):
 *
 *   node dist/scripts/migrar-base64-a-archivos.js            # aplica
 *   node dist/scripts/migrar-base64-a-archivos.js --dry-run  # solo cuenta
 *
 * Requisito previo: haber corrido data/migrations/009_archivo.sql.
 * ========================================================================= */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';
import { Bucket, EXT_BY_MIME } from '../almacenamiento/almacenamiento.constants';

type Objetivo = {
  tabla: string;
  columna: string;
  entidadTipo: string;
  // Fijo, o 'auto' para decidir por el mimetype (imagen -> publico, pdf -> privado).
  bucket: Bucket | 'auto';
};

const OBJETIVOS: Objetivo[] = [
  { tabla: 'proyecto_imagen', columna: 'url', entidadTipo: 'proyecto_imagen', bucket: 'publico' },
  { tabla: 'empresa_imagen', columna: 'url', entidadTipo: 'empresa_imagen', bucket: 'publico' },
  { tabla: 'empresa', columna: 'logo_url', entidadTipo: 'empresa_logo', bucket: 'publico' },
  { tabla: 'empresa', columna: 'documento_url', entidadTipo: 'empresa_documento', bucket: 'privado' },
  { tabla: 'usuario', columna: 'foto_url', entidadTipo: 'usuario_foto', bucket: 'publico' },
  { tabla: 'usuario', columna: 'documento_url', entidadTipo: 'usuario_documento', bucket: 'privado' },
  { tabla: 'proyecto', columna: 'documento_url', entidadTipo: 'proyecto_documento', bucket: 'privado' },
  { tabla: 'recurso', columna: 'url', entidadTipo: 'recurso', bucket: 'auto' },
  { tabla: 'solicitud_proyecto', columna: 'propuesta_url', entidadTipo: 'solicitud_propuesta', bucket: 'privado' },
  { tabla: 'solicitud_proyecto', columna: 'cv_url', entidadTipo: 'solicitud_cv', bucket: 'privado' },
  { tabla: 'solicitud_membresia', columna: 'documento_url', entidadTipo: 'solicitud_membresia_doc', bucket: 'privado' },
  { tabla: 'mensaje', columna: 'archivo_url', entidadTipo: 'mensaje_adjunto', bucket: 'privado' },
];

const LOTE = 50;
const DRY_RUN = process.argv.includes('--dry-run');

const MIME_ALIAS: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
};

function parseDataUrl(valor: string): { mime: string; buffer: Buffer } | null {
  const m = /^data:([\w.+-]+\/[\w.+-]+)?(;[\w-]+=[\w-]+)*(;base64)?,([\s\S]*)$/.exec(valor);
  if (!m) return null;
  let mime = (m[1] || 'application/octet-stream').toLowerCase();
  mime = MIME_ALIAS[mime] || mime;
  const esBase64 = !!m[3];
  const datos = m[4] || '';
  const buffer = esBase64
    ? Buffer.from(datos, 'base64')
    : Buffer.from(decodeURIComponent(datos), 'utf8');
  if (!buffer.length) return null;
  return { mime, buffer };
}

async function main() {
  const log = new Logger('migrar-base64');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const ds = app.get(DataSource);
  const almacenamiento = app.get(AlmacenamientoService);

  log.log(DRY_RUN ? '── DRY RUN (no escribe nada) ──' : '── Migrando base64 -> archivos ──');

  const totales = { migrados: 0, saltados: 0, errores: 0 };

  for (const obj of OBJETIVOS) {
    let existeTabla: { exists: boolean }[];
    try {
      existeTabla = await ds.query(
        `SELECT EXISTS (SELECT FROM information_schema.columns
           WHERE table_name = $1 AND column_name = $2) AS exists`,
        [obj.tabla, obj.columna],
      );
    } catch (e: any) {
      log.error(`No pude verificar ${obj.tabla}.${obj.columna}: ${e.message}`);
      continue;
    }
    if (!existeTabla[0]?.exists) {
      log.warn(`${obj.tabla}.${obj.columna} no existe, se omite`);
      continue;
    }

    const parcial = { migrados: 0, saltados: 0, errores: 0 };
    // IDs que no se pudieron migrar en esta corrida: se excluyen del siguiente
    // lote para no entrar en loop infinito. NO se toca su valor en la BD (el
    // dato original se conserva; queda para revisar a mano).
    const problematicos = new Set<number>();

    // Bucle por lotes: cada fila migrada deja de cumplir LIKE 'data:%', así que
    // volver a pedir los primeros N reanuda hasta agotar.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const excluir = [...problematicos];
      const filas: { id: number; val: string }[] = await ds.query(
        `SELECT id, ${obj.columna} AS val
           FROM ${obj.tabla}
          WHERE ${obj.columna} LIKE 'data:%'
            ${excluir.length ? `AND id <> ALL($1::int[])` : ''}
          ORDER BY id
          LIMIT ${LOTE}`,
        excluir.length ? [excluir] : undefined,
      );
      if (!filas.length) break;

      for (const fila of filas) {
        const parsed = parseDataUrl(fila.val);
        if (!parsed || !EXT_BY_MIME[parsed.mime]) {
          parcial.saltados++;
          problematicos.add(fila.id);
          log.warn(
            `${obj.tabla}#${fila.id}.${obj.columna}: data URL no soportada (${
              parsed?.mime ?? 'sin mime'
            })`,
          );
          continue;
        }

        const bucket: Bucket =
          obj.bucket === 'auto'
            ? parsed.mime === 'application/pdf'
              ? 'privado'
              : 'publico'
            : obj.bucket;

        if (DRY_RUN) {
          parcial.migrados++;
          problematicos.add(fila.id); // en dry-run no se actualiza: evita re-contar
          continue;
        }

        try {
          const guardado = await almacenamiento.guardarBufferCrudo({
            buffer: parsed.buffer,
            mimetype: parsed.mime,
            bucket,
            entidadTipo: obj.entidadTipo,
            entidadId: fila.id,
          });
          await ds.query(
            `UPDATE ${obj.tabla} SET ${obj.columna} = $1 WHERE id = $2`,
            [guardado.url, fila.id],
          );
          parcial.migrados++;
        } catch (e: any) {
          parcial.errores++;
          problematicos.add(fila.id);
          log.error(`${obj.tabla}#${fila.id}.${obj.columna}: ${e.message}`);
        }
      }
    }

    totales.migrados += parcial.migrados;
    totales.saltados += parcial.saltados;
    totales.errores += parcial.errores;
    log.log(
      `${obj.tabla}.${obj.columna}: ${parcial.migrados} migrados, ` +
        `${parcial.saltados} saltados, ${parcial.errores} errores`,
    );
  }

  log.log(
    `── Total: ${totales.migrados} migrados, ${totales.saltados} saltados, ${totales.errores} errores ──`,
  );
  if (!DRY_RUN) {
    const uso = await almacenamiento.uso(true);
    log.log(
      `Almacenamiento: ${(uso.usado / 1e9).toFixed(2)} GB / ${(uso.max / 1e9).toFixed(
        2,
      )} GB (${uso.porcentaje.toFixed(1)}%) en ${uso.archivos} archivos`,
    );
  }

  await app.close();
  process.exit(totales.errores > 0 ? 1 : 0);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
