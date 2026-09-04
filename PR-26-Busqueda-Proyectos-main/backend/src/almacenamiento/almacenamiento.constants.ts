// Límites y tipos permitidos para la subida de archivos. Alineados con los que
// ya usaba recurso.controller.ts cuando devolvía base64.

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB (techo de Multer: imagen o PDF)
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB (el PDF no se recomprime)
export const IMAGE_MAX_DIMENSION = 1600; // px, lado más largo
export const IMAGE_JPEG_QUALITY = 80;

export const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;

export type Bucket = 'publico' | 'privado';

// mimetype -> extensión en disco. Las imágenes siempre se normalizan a jpeg.
export const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

// Prefijo público de las rutas que se guardan en las columnas *_url de la BD.
// setGlobalPrefix('api') en main.ts hace que el controller quede bajo /api.
export const RUTA_PUBLICA_BASE = '/api/archivos';

// Todas las columnas *_url que pueden apuntar a un archivo del almacenamiento.
// La usan la limpieza de huérfanos y el borrado con refcount.
export const COLUMNAS_URL: readonly [tabla: string, columna: string][] = [
  ['proyecto_imagen', 'url'],
  ['empresa_imagen', 'url'],
  ['empresa', 'logo_url'],
  ['empresa', 'documento_url'],
  ['usuario', 'foto_url'],
  ['usuario', 'documento_url'],
  ['proyecto', 'documento_url'],
  ['recurso', 'url'],
  ['solicitud_proyecto', 'propuesta_url'],
  ['solicitud_proyecto', 'cv_url'],
  ['solicitud_membresia', 'documento_url'],
  ['mensaje', 'archivo_url'],
];
