/* ============================================================================
 * Mueve al bucket PÚBLICO los archivos que ya no tienen por qué estar en el
 * privado: los recursos de un proyecto (`recurso.url`) y el documento del
 * proyecto (`proyecto.documento_url`). Antes, todos los PDF caían en `privado`
 * y había que re-descargarlos con fetch+blob en cada apertura; en el bucket
 * público el navegador los abre directo y los cachea.
 *
 * Lo sensible (CV, propuestas, cédulas, documentos de empresa/membresía,
 * adjuntos de chat) NO se toca — sigue en `privado`.
 *
 * Por cada archivo: mueve el file en disco de privado/AAAA/MM/ a publico/AAAA/MM/,
 * y actualiza la fila en `archivo` y las columnas que lo referencian. Idempotente
 * (si ya está en publico, lo saltea). Mueve, no borra.
 *
 * Uso (dentro del contenedor backend):
 *   node dist/scripts/recursos-a-publico.js --dry-run
 *   node dist/scripts/recursos-a-publico.js
 * ========================================================================= */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { AppModule } from '../app.module';
import { RUTA_PUBLICA_BASE } from '../almacenamiento/almacenamiento.constants';

const DRY_RUN = process.argv.includes('--dry-run');

// [tabla, columna] con archivos que pasan a público.
const OBJETIVOS: [tabla: string, columna: string][] = [
  ['recurso', 'url'],
  ['proyecto', 'documento_url'],
];

async function main() {
  const log = new Logger('recursos-a-publico');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const ds = app.get(DataSource);
  const baseDir = process.env.ALMACENAMIENTO_DIR || join(process.cwd(), 'almacenamiento_data');

  // url vieja -> url nueva, para no mover dos veces el mismo archivo compartido.
  const yaProcesada = new Map<string, string>();
  let movidos = 0;
  let refsActualizadas = 0;
  let saltados = 0;
  let errores = 0;

  for (const [tabla, columna] of OBJETIVOS) {
    let filas: { valor: string }[];
    try {
      filas = await ds.query(
        `SELECT DISTINCT ${columna} AS valor FROM ${tabla}
          WHERE ${columna} LIKE '%${RUTA_PUBLICA_BASE}/privado/%'`,
      );
    } catch (e: any) {
      log.warn(`No pude leer ${tabla}.${columna}: ${e.message}`);
      continue;
    }

    for (const { valor } of filas) {
      const rel = valor.slice(valor.indexOf(`${RUTA_PUBLICA_BASE}/`) + RUTA_PUBLICA_BASE.length + 1);
      // rel = 'privado/AAAA/MM/uuid.ext'
      if (!rel.startsWith('privado/')) {
        saltados++;
        continue;
      }
      const relNueva = 'publico/' + rel.slice('privado/'.length);
      const urlNueva = `${RUTA_PUBLICA_BASE}/${relNueva}`;

      if (!yaProcesada.has(valor)) {
        const fisicaVieja = join(baseDir, rel);
        const fisicaNueva = join(baseDir, relNueva);

        if (DRY_RUN) {
          log.log(`mover  ${rel}  ->  ${relNueva}`);
          yaProcesada.set(valor, urlNueva);
        } else {
          try {
            await fs.mkdir(dirname(fisicaNueva), { recursive: true });
            await fs.rename(fisicaVieja, fisicaNueva).catch(async (e) => {
              // Si el archivo ya no está en privado pero sí en publico, seguimos
              // (idempotente); cualquier otro error se propaga.
              await fs.access(fisicaNueva);
              if (e.code !== 'ENOENT') throw e;
            });
            await ds.query(
              `UPDATE archivo SET bucket = 'publico', ruta_relativa = $1 WHERE ruta_relativa = $2`,
              [relNueva, rel],
            );
            movidos++;
            yaProcesada.set(valor, urlNueva);
          } catch (e: any) {
            errores++;
            log.error(`${rel}: ${e.message}`);
            continue;
          }
        }
      }

      // Actualiza las referencias en ESTA columna (puede haber varias filas).
      if (!DRY_RUN) {
        const r: unknown[] = await ds.query(
          `UPDATE ${tabla} SET ${columna} = $1 WHERE ${columna} = $2 RETURNING 1`,
          [yaProcesada.get(valor), valor],
        );
        refsActualizadas += Array.isArray(r) ? r.length : 0;
      }
    }
  }

  log.log(
    DRY_RUN
      ? `DRY RUN — ${yaProcesada.size} archivos a mover, ${saltados} saltados`
      : `${movidos} archivos movidos, ${refsActualizadas} referencias actualizadas, ${saltados} saltados, ${errores} errores`,
  );

  await app.close();
  process.exit(errores > 0 ? 1 : 0);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
