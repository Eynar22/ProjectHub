/* ============================================================================
 * src/features/proyectos/services/archivos.ts
 * Subida de archivos (imágenes / PDF) al backend. Devuelve la ruta
 * `/api/archivos/...` que se guarda tal cual en la BD. El backend comprime las
 * imágenes y escribe todo en disco (ya no viaja base64).
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

/**
 * @param opts.privado true para documentos sensibles (CV, propuesta de una
 *   postulación) — se sirven con sesión y sin caché. Por defecto va al bucket
 *   público (recursos de proyecto: se abren directo y cachean).
 */
export async function subirArchivo(
  file: File,
  opts?: { privado?: boolean },
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { url } = await apiClient.post<{ url: string }>(
    ENDPOINTS.RECURSOS.UPLOAD,
    formData,
    opts?.privado ? { params: { bucket: 'privado' } } : undefined,
  );
  return url;
}
