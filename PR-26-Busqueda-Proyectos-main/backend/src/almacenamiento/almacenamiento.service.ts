import {
  Injectable,
  Logger,
  OnModuleInit,
  HttpException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, sep, normalize } from 'path';
import sharp from 'sharp';
import { Archivo } from '../entities/archivo.entity';
import {
  ALLOWED_MIMETYPES,
  Bucket,
  COLUMNAS_URL,
  EXT_BY_MIME,
  IMAGE_JPEG_QUALITY,
  IMAGE_MAX_DIMENSION,
  MAX_PDF_BYTES,
  RUTA_PUBLICA_BASE,
} from './almacenamiento.constants';

export interface ArchivoGuardado {
  id: string;
  url: string; // '/api/archivos/<bucket>/AAAA/MM/<id>.<ext>' — esto va a la columna *_url
  ruta_relativa: string;
  bucket: Bucket;
  mimetype: string;
  size_bytes: number;
  nombre_original: string | null;
}

const SEG_ANIO = /^\d{4}$/;
const SEG_MES = /^\d{2}$/;
const SEG_NOMBRE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{2,5}$/;

@Injectable()
export class AlmacenamientoService implements OnModuleInit {
  private readonly logger = new Logger(AlmacenamientoService.name);
  private readonly baseDir: string;
  private readonly maxBytes: number;

  // Uso total cacheado para no sumar en la BD en cada subida.
  private usoCacheBytes = 0;
  private usoCacheAt = 0;
  private static readonly USO_TTL_MS = 30_000;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Archivo) private readonly archivoRepo: Repository<Archivo>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {
    this.baseDir = normalize(
      this.config.get<string>('ALMACENAMIENTO_DIR') || join(process.cwd(), 'almacenamiento_data'),
    );
    this.maxBytes = Number(
      this.config.get<string>('ALMACENAMIENTO_MAX_BYTES') || 55 * 1024 * 1024 * 1024,
    );
  }

  async onModuleInit() {
    for (const bucket of ['publico', 'privado'] as Bucket[]) {
      await fs.mkdir(join(this.baseDir, bucket), { recursive: true });
    }
    try {
      const { usado, porcentaje } = await this.uso(true);
      this.logger.log(
        `Almacenamiento en ${this.baseDir} — ${(usado / 1e9).toFixed(2)} GB usados de ` +
          `${(this.maxBytes / 1e9).toFixed(2)} GB (${porcentaje.toFixed(1)}%)`,
      );
    } catch (e: any) {
      // Típico: la tabla `archivo` aún no existe. No bloquea el arranque; las
      // subidas fallarán con un error claro hasta que corra 009_archivo.sql.
      this.logger.warn(
        `No se pudo leer el uso de almacenamiento (¿falta la migración 009_archivo.sql?): ${e.message}`,
      );
    }
  }

  // ── Subida ────────────────────────────────────────────────────────────────

  /** Procesa un archivo de Multer (memory storage) y lo guarda en el bucket dado. */
  async guardarDesdeMulter(
    file: { buffer: Buffer; mimetype: string; originalname?: string; size: number },
    bucket: Bucket,
    subidoPor: number | null,
  ): Promise<ArchivoGuardado> {
    if (!file || !file.buffer?.length) {
      throw new PayloadTooLargeException('No se recibió ningún archivo');
    }
    if (!ALLOWED_MIMETYPES.includes(file.mimetype as any)) {
      throw new UnsupportedMediaTypeException(
        'Solo se permiten imágenes (JPG, PNG, WEBP, GIF) o archivos PDF',
      );
    }

    let buffer = file.buffer;
    let mimetype = file.mimetype;

    if (mimetype === 'application/pdf') {
      if (file.size > MAX_PDF_BYTES) {
        throw new PayloadTooLargeException(
          `El PDF supera el máximo permitido de ${MAX_PDF_BYTES / (1024 * 1024)} MB`,
        );
      }
    } else {
      // Imagen: se redimensiona y recomprime a JPEG (igual que hacía recurso.controller).
      buffer = await sharp(file.buffer)
        .rotate()
        .resize({
          width: IMAGE_MAX_DIMENSION,
          height: IMAGE_MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
      mimetype = 'image/jpeg';
    }

    await this.verificarCuota(buffer.length);

    return this.escribirYRegistrar({
      buffer,
      mimetype,
      bucket,
      nombreOriginal: file.originalname ?? null,
      subidoPor,
      referenciado: false,
    });
  }

  /**
   * Guarda un buffer YA listo (sin recomprimir ni topes de tamaño). Lo usa el
   * script de migración de base64 a disco: el contenido ya venía procesado y no
   * queremos rechazar datos que llevan tiempo en producción. Sí actualiza el
   * uso; el llamador decide si le importa la cuota.
   */
  async guardarBufferCrudo(params: {
    buffer: Buffer;
    mimetype: string;
    bucket: Bucket;
    nombreOriginal?: string | null;
    subidoPor?: number | null;
    entidadTipo?: string | null;
    entidadId?: number | null;
  }): Promise<ArchivoGuardado> {
    if (!EXT_BY_MIME[params.mimetype]) {
      throw new Error(`mimetype no soportado: ${params.mimetype}`);
    }
    return this.escribirYRegistrar({
      buffer: params.buffer,
      mimetype: params.mimetype,
      bucket: params.bucket,
      nombreOriginal: params.nombreOriginal ?? null,
      subidoPor: params.subidoPor ?? null,
      entidadTipo: params.entidadTipo ?? null,
      entidadId: params.entidadId ?? null,
      referenciado: true,
    });
  }

  private async escribirYRegistrar(p: {
    buffer: Buffer;
    mimetype: string;
    bucket: Bucket;
    nombreOriginal: string | null;
    subidoPor: number | null;
    referenciado: boolean;
    entidadTipo?: string | null;
    entidadId?: number | null;
  }): Promise<ArchivoGuardado> {
    const id = randomUUID();
    const ext = EXT_BY_MIME[p.mimetype];
    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const rutaRelativa = `${p.bucket}/${yyyy}/${mm}/${id}.${ext}`;
    const rutaFisica = join(this.baseDir, p.bucket, yyyy, mm, `${id}.${ext}`);

    await fs.mkdir(join(this.baseDir, p.bucket, yyyy, mm), { recursive: true });
    await fs.writeFile(rutaFisica, p.buffer);

    try {
      await this.archivoRepo.insert({
        id,
        bucket: p.bucket,
        ruta_relativa: rutaRelativa,
        mimetype: p.mimetype,
        size_bytes: p.buffer.length,
        nombre_original: p.nombreOriginal,
        subido_por: p.subidoPor,
        entidad_tipo: p.entidadTipo ?? null,
        entidad_id: p.entidadId ?? null,
        referenciado: p.referenciado,
      });
    } catch (e) {
      // Si falla el registro en BD, no dejamos el archivo colgado.
      await fs.rm(rutaFisica, { force: true });
      throw e;
    }

    this.usoCacheBytes += p.buffer.length;

    return {
      id,
      url: `${RUTA_PUBLICA_BASE}/${rutaRelativa}`,
      ruta_relativa: rutaRelativa,
      bucket: p.bucket,
      mimetype: p.mimetype,
      size_bytes: p.buffer.length,
      nombre_original: p.nombreOriginal,
    };
  }

  // ── Lectura / servido ─────────────────────────────────────────────────────

  /** Valida los segmentos de la URL y devuelve la ruta física + el registro. */
  async resolverParaServir(
    bucket: string,
    anio: string,
    mes: string,
    nombre: string,
  ): Promise<{ rutaFisica: string; archivo: Archivo }> {
    if (
      (bucket !== 'publico' && bucket !== 'privado') ||
      !SEG_ANIO.test(anio) ||
      !SEG_MES.test(mes) ||
      !SEG_NOMBRE.test(nombre)
    ) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const rutaRelativa = `${bucket}/${anio}/${mes}/${nombre}`;
    const rutaFisica = normalize(join(this.baseDir, bucket, anio, mes, nombre));

    // Defensa en profundidad contra path traversal.
    if (!rutaFisica.startsWith(this.baseDir + sep)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const archivo = await this.archivoRepo.findOne({ where: { ruta_relativa: rutaRelativa } });
    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    try {
      await fs.access(rutaFisica);
    } catch {
      throw new NotFoundException('Archivo no encontrado');
    }

    return { rutaFisica, archivo };
  }

  /**
   * ¿Puede este usuario ver un archivo del bucket privado?
   * Fase 2: superadmin o quien lo subió. Fase 4 lo amplía a participantes del
   * proyecto / admin de la empresa según entidad_tipo / entidad_id.
   */
  puedeVerPrivado(user: { id: number; rol: string } | undefined, archivo: Archivo): boolean {
    if (!user) return false;
    if (user.rol === 'superadmin') return true;
    return archivo.subido_por === user.id;
  }

  // ── Borrado ───────────────────────────────────────────────────────────────

  /** Borra el archivo (disco + registro) a partir de la ruta guardada en una columna *_url. */
  async eliminarPorUrl(url: string | null | undefined): Promise<void> {
    if (!url) return;
    const rutaRelativa = this.urlARutaRelativa(url);
    if (!rutaRelativa) return; // valor viejo (base64 / http externo): se ignora

    const archivo = await this.archivoRepo.findOne({ where: { ruta_relativa: rutaRelativa } });
    const rutaFisica = normalize(join(this.baseDir, rutaRelativa));
    if (rutaFisica.startsWith(this.baseDir + sep)) {
      await fs.rm(rutaFisica, { force: true }).catch((e) =>
        this.logger.warn(`No se pudo borrar ${rutaFisica}: ${e.message}`),
      );
    }
    if (archivo) {
      await this.archivoRepo.delete({ id: archivo.id });
      this.usoCacheBytes = Math.max(0, this.usoCacheBytes - archivo.size_bytes);
    }
  }

  async eliminarPorUrls(urls: (string | null | undefined)[]): Promise<void> {
    for (const u of urls) await this.eliminarPorUrl(u);
  }

  /**
   * Borra el archivo solo si NINGUNA columna *_url lo sigue apuntando. Se usa
   * cuando el mismo archivo puede estar referenciado más de una vez (p. ej. una
   * imagen de proyecto que también existe como recurso). Llamar DESPUÉS de haber
   * quitado de la BD la fila que ya no lo usa.
   */
  async eliminarPorUrlSiHuerfano(url: string | null | undefined): Promise<void> {
    if (!url) return;
    const rutaRelativa = this.urlARutaRelativa(url);
    if (!rutaRelativa) return;
    const like = `%${RUTA_PUBLICA_BASE}/${rutaRelativa}%`;
    for (const [tabla, columna] of COLUMNAS_URL) {
      try {
        const hit = await this.ds.query(
          `SELECT 1 FROM ${tabla} WHERE ${columna} LIKE $1 LIMIT 1`,
          [like],
        );
        if (hit.length) return; // sigue en uso
      } catch {
        // tabla/columna ausente en este entorno: se ignora
      }
    }
    await this.eliminarPorUrl(url);
  }

  async eliminarPorUrlsSiHuerfanas(urls: (string | null | undefined)[]): Promise<void> {
    for (const u of urls) await this.eliminarPorUrlSiHuerfano(u);
  }

  /** Borra un archivo por su id de registro (disco + fila). Lo usa la limpieza de huérfanos. */
  async eliminarPorId(id: string): Promise<void> {
    const archivo = await this.archivoRepo.findOne({ where: { id } });
    if (!archivo) return;
    const rutaFisica = normalize(join(this.baseDir, archivo.ruta_relativa));
    if (rutaFisica.startsWith(this.baseDir + sep)) {
      await fs.rm(rutaFisica, { force: true }).catch((e) =>
        this.logger.warn(`No se pudo borrar ${rutaFisica}: ${e.message}`),
      );
    }
    await this.archivoRepo.delete({ id });
    this.usoCacheBytes = Math.max(0, this.usoCacheBytes - archivo.size_bytes);
  }

  // ── Cuota / uso ───────────────────────────────────────────────────────────

  async uso(forzar = false): Promise<{
    usado: number;
    max: number;
    porcentaje: number;
    archivos: number;
    dir: string;
  }> {
    const now = Date.now();
    if (forzar || now - this.usoCacheAt > AlmacenamientoService.USO_TTL_MS) {
      const row = await this.archivoRepo
        .createQueryBuilder('a')
        .select('COALESCE(SUM(a.size_bytes), 0)', 'total')
        .addSelect('COUNT(*)', 'n')
        .getRawOne<{ total: string; n: string }>();
      this.usoCacheBytes = Number(row?.total ?? 0);
      this.usoCacheAt = now;
    }
    const archivos = await this.archivoRepo.count();
    return {
      usado: this.usoCacheBytes,
      max: this.maxBytes,
      porcentaje: this.maxBytes ? (this.usoCacheBytes / this.maxBytes) * 100 : 0,
      archivos,
      dir: this.baseDir,
    };
  }

  private async verificarCuota(entranteBytes: number): Promise<void> {
    const { usado } = await this.uso();
    if (usado + entranteBytes > this.maxBytes) {
      throw new HttpException(
        'El almacenamiento de archivos está lleno. Contacta al administrador de la plataforma.',
        HttpStatus.INSUFFICIENT_STORAGE, // 507
      );
    }
    const pct = ((usado + entranteBytes) / this.maxBytes) * 100;
    if (pct >= 95) this.logger.error(`Almacenamiento al ${pct.toFixed(1)}% — casi lleno`);
    else if (pct >= 80) this.logger.warn(`Almacenamiento al ${pct.toFixed(1)}%`);
  }

  // ── Utilidades ────────────────────────────────────────────────────────────

  /** '/api/archivos/publico/2026/03/x.jpg' -> 'publico/2026/03/x.jpg' (o null si no es una ruta nuestra). */
  private urlARutaRelativa(url: string): string | null {
    const marca = `${RUTA_PUBLICA_BASE}/`;
    const i = url.indexOf(marca);
    if (i === -1) return null;
    const rel = url.slice(i + marca.length).split('?')[0].split('#')[0];
    return rel.startsWith('publico/') || rel.startsWith('privado/') ? rel : null;
  }
}
