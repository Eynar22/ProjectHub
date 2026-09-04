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
