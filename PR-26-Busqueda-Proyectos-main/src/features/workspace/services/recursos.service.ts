/* ============================================================================
 * src/features/workspace/services/recursos.service.ts
 * Recursos (archivos y carpetas) de un proyecto y subida de archivos
 * (RecursoController).
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { Resource } from '@/features/proyectos';

export const recursosService = {
  /** Todos los recursos (el backend suele devolverlos anidados en el proyecto). */
  async listar(): Promise<Resource[]> {
    return apiClient.get<Resource[]>(ENDPOINTS.RECURSOS.LISTAR);
  },

  /** Crea un recurso (carpeta o archivo ya subido). */
  async crear(datos: Record<string, unknown>): Promise<Resource> {
    return apiClient.post<Resource>(ENDPOINTS.RECURSOS.CREAR, datos);
  },

  /** Elimina un recurso por id. */
  async eliminar(id: number | string): Promise<void> {
    await apiClient.delete(ENDPOINTS.RECURSOS.ELIMINAR(id));
  },

  /**
   * Sube un archivo. El backend lo comprime/redimensiona y devuelve su
   * representación base64 (y el nombre original).
   */
  async subirArchivo(file: File): Promise<{ base64: string; filename?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ base64: string; filename?: string }>(
      ENDPOINTS.RECURSOS.UPLOAD,
      formData,
    );
  },
};
