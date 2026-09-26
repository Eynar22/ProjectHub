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
   *
   * `subido_por` NO alcanza como único criterio: el registro sube sin sesión
   * (subido_por queda null) y, sobre todo, quien necesita ver la mayoría de estos
   * documentos NO es quien los subió — el dueño del proyecto revisa el CV/propuesta
   * de un postulante, el admin de la empresa revisa el documento de un empleado que
   * se une, etc. Como el `archivo` no queda enlazado a esa fila al subirlo
   * (entidad_tipo/entidad_id se completan recién en la migración), se resuelve el
   * permiso en el momento: se busca qué fila de negocio referencia hoy esta ruta y
   * se aplica la regla de esa relación.
   */
  async puedeVerPrivado(
    user: { id: number; rol: string } | undefined,
    archivo: Archivo,
  ): Promise<boolean> {
    if (!user) return false;
    if (user.rol === 'superadmin') return true;
    if (archivo.subido_por === user.id) return true;

    const like = `%${RUTA_PUBLICA_BASE}/${archivo.ruta_relativa}%`;

    // Documento/foto propios del usuario (típico cuando se subieron en el
    // registro, sin sesión, y por eso subido_por quedó null).
    const usuario = await this.ds.query(
      `SELECT id FROM usuario WHERE documento_url LIKE $1 OR foto_url LIKE $1 LIMIT 1`,
      [like],
    );
    if (usuario[0] && Number(usuario[0].id) === user.id) return true;

    // Documento de la empresa: lo revisa el/los admin de esa misma empresa.
    const empresa = await this.ds.query(
      `SELECT id FROM empresa WHERE documento_url LIKE $1 LIMIT 1`,
      [like],
    );
    if (empresa[0] && (await this.esAdminDeEmpresa(user.id, Number(empresa[0].id)))) return true;

    // CV / propuesta de una postulación a proyecto: el propio postulante (por si
    // subido_por no coincidiera) o el dueño del proyecto.
    const solicitudProyecto = await this.ds.query(
      `SELECT sp.usuario_id, p.creador_id
         FROM solicitud_proyecto sp
         JOIN proyecto p ON p.id = sp.proyecto_id
        WHERE sp.propuesta_url LIKE $1 OR sp.cv_url LIKE $1
        LIMIT 1`,
      [like],
    );
    if (solicitudProyecto[0]) {
      const { usuario_id, creador_id } = solicitudProyecto[0];
      if (Number(usuario_id) === user.id || Number(creador_id) === user.id) return true;
    }

    // Documento de una solicitud de membresía a empresa: el propio solicitante o
    // el admin de esa empresa.
    const solicitudMembresia = await this.ds.query(
      `SELECT usuario_id, empresa_id FROM solicitud_membresia WHERE documento_url LIKE $1 LIMIT 1`,
      [like],
    );
    if (solicitudMembresia[0]) {
      const { usuario_id, empresa_id } = solicitudMembresia[0];
      if (Number(usuario_id) === user.id) return true;
      if (await this.esAdminDeEmpresa(user.id, Number(empresa_id))) return true;
    }

    // PDF de un recurso del workspace: cualquier participante del proyecto.
    const recurso = await this.ds.query(
      `SELECT proyecto_id FROM recurso WHERE url LIKE $1 LIMIT 1`,
      [like],
    );
    if (recurso[0] && (await this.esParticipanteDeProyecto(user.id, Number(recurso[0].proyecto_id)))) {
      return true;
    }

    // Adjunto de un mensaje de chat: cualquier participante del proyecto del chat.
    const mensaje = await this.ds.query(
      `SELECT c.proyecto_id
         FROM mensaje m
         JOIN chat c ON c.id = m.chat_id
        WHERE m.archivo_url LIKE $1
        LIMIT 1`,
      [like],
    );
    if (mensaje[0] && (await this.esParticipanteDeProyecto(user.id, Number(mensaje[0].proyecto_id)))) {
      return true;
    }

    return false;
  }

  private async esAdminDeEmpresa(usuarioId: number, empresaId: number): Promise<boolean> {
    const rows = await this.ds.query(
      `SELECT 1 FROM usuario WHERE id = $1 AND empresa_id = $2 AND rol = 'admin' LIMIT 1`,
      [usuarioId, empresaId],
    );
    return rows.length > 0;
  }

  private async esParticipanteDeProyecto(usuarioId: number, proyectoId: number): Promise<boolean> {
    const rows = await this.ds.query(
      `SELECT 1 FROM proyecto p
        WHERE p.id = $2 AND (
          p.creador_id = $1
          OR EXISTS (SELECT 1 FROM usuario_proyecto up WHERE up.proyecto_id = $2 AND up.usuario_id = $1)
        )
        LIMIT 1`,
      [usuarioId, proyectoId],
    );
    return rows.length > 0;
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
