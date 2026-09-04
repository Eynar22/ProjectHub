import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AlmacenamientoService } from './almacenamiento.service';
import { COLUMNAS_URL } from './almacenamiento.constants';

const UUID_EN_RUTA =
  /archivos\/(?:publico|privado)\/\d{4}\/\d{2}\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\./i;

const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
const RETRASO_ARRANQUE_MS = 5 * 60 * 1000;
// Un archivo debe tener al menos esta antigüedad para considerarse huérfano
// (evita borrar algo recién subido que aún no se guardó en su columna).
const GRACIA = "interval '2 days'";

/**
 * Red de seguridad: cada semana borra del disco los archivos que ya no están
 * referenciados por ninguna columna *_url. No depende del flag `referenciado`;
 * reconstruye el conjunto de ids en uso escaneando las columnas.
 */
@Injectable()
export class LimpiezaArchivosService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LimpiezaArchivosService.name);
  private timer?: NodeJS.Timeout;
  private arranque?: NodeJS.Timeout;

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly almacenamiento: AlmacenamientoService,
  ) {}

  onModuleInit() {
    this.arranque = setTimeout(() => {
      void this.ejecutar('arranque');
    }, RETRASO_ARRANQUE_MS);
    this.timer = setInterval(() => {
      void this.ejecutar('semanal');
    }, SEMANA_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.arranque) clearTimeout(this.arranque);
  }

  async ejecutar(origen: string): Promise<{ borrados: number; bytes: number }> {
    try {
      const enUso = new Set<string>();
      for (const [tabla, columna] of COLUMNAS_URL) {
        let filas: { v: string }[];
        try {
          filas = await this.ds.query(
            `SELECT ${columna} AS v FROM ${tabla} WHERE ${columna} LIKE '%/api/archivos/%'`,
          );
        } catch (e: any) {
          // Tabla/columna inexistente en este entorno: se ignora, pero NO se
          // continúa con el borrado (podría faltar una referencia).
          this.logger.warn(`limpieza: no pude leer ${tabla}.${columna}: ${e.message}`);
          return { borrados: 0, bytes: 0 };
        }
        for (const f of filas) {
          const m = UUID_EN_RUTA.exec(f.v);
          if (m) enUso.add(m[1].toLowerCase());
        }
      }

      const candidatos: { id: string; size_bytes: string }[] = await this.ds.query(
        `SELECT id, size_bytes FROM archivo WHERE creado_en < now() - ${GRACIA}`,
      );
      const totalArchivos: [{ n: string }] = await this.ds.query(
        `SELECT COUNT(*) AS n FROM archivo`,
      );

      // Salvaguarda: si no se encontró NINGUNA referencia pero hay bastantes
      // archivos, algo salió mal en el escaneo. No se borra nada.
      if (enUso.size === 0 && Number(totalArchivos[0].n) > 5) {
        this.logger.error(
          `limpieza (${origen}): 0 referencias encontradas con ${totalArchivos[0].n} archivos; se aborta por seguridad`,
        );
        return { borrados: 0, bytes: 0 };
      }

      let borrados = 0;
      let bytes = 0;
      for (const c of candidatos) {
        if (enUso.has(c.id.toLowerCase())) continue;
        await this.almacenamiento.eliminarPorId(c.id);
        borrados++;
        bytes += Number(c.size_bytes);
      }

      if (borrados > 0) {
        this.logger.log(
          `limpieza (${origen}): ${borrados} huérfanos borrados (${(bytes / 1e6).toFixed(1)} MB)`,
        );
      } else {
        this.logger.log(`limpieza (${origen}): sin huérfanos`);
      }
      return { borrados, bytes };
    } catch (e: any) {
      this.logger.error(`limpieza (${origen}) falló: ${e.message}`);
      return { borrados: 0, bytes: 0 };
    }
  }
}
