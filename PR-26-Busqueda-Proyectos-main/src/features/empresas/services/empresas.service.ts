/* ============================================================================
 * src/features/empresas/services/empresas.service.ts
 *
 * Responsabilidad: hablar con los endpoints de empresas del backend.
 * NO maneja estado. NO muestra toasts. NO conoce React.
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { Company, ActualizarCompanyDto, EmpresaPublica, EmpresaPublicaDetalle } from '../types/empresas.types';

export const empresasService = {
  /** Todas las empresas (el listado no incluye galería de imágenes). */
  async listar(): Promise<Company[]> {
    return apiClient.get<Company[]>(ENDPOINTS.EMPRESAS.LISTAR);
  },

  /** Empresa por id, con sus relaciones (imágenes, enlaces, usuarios). */
  async obtenerPorId(id: number | string): Promise<Company> {
    return apiClient.get<Company>(ENDPOINTS.EMPRESAS.DETALLE(id));
  },

  /** Actualiza campos parciales de una empresa. */
  async actualizar(id: number | string, dto: ActualizarCompanyDto): Promise<Company> {
    return apiClient.patch<Company>(ENDPOINTS.EMPRESAS.ACTUALIZAR(id), dto);
  },

  /** Aprueba una empresa pendiente (superadmin). */
  async aprobar(id: number | string): Promise<void> {
    await apiClient.patch(ENDPOINTS.EMPRESAS.APROBAR(id), {});
  },

  /** Bloquea una empresa (superadmin). */
  async bloquear(id: number | string): Promise<void> {
    await apiClient.patch(ENDPOINTS.EMPRESAS.BLOQUEAR(id), {});
  },

  /** Desbloquea una empresa previamente bloqueada (superadmin). */
  async desbloquear(id: number | string): Promise<void> {
    await apiClient.patch(ENDPOINTS.EMPRESAS.DESBLOQUEAR(id), {});
  },

  /** Directorio público: empresas aprobadas con conteos de proyectos y ODS. */
  async listarPublicas(): Promise<EmpresaPublica[]> {
    return apiClient.get<EmpresaPublica[]>(ENDPOINTS.EMPRESAS.PUBLICAS);
  },

  /** Página pública de una empresa: galería, enlaces y proyectos públicos. */
  async obtenerPublica(id: number | string): Promise<EmpresaPublicaDetalle> {
    return apiClient.get<EmpresaPublicaDetalle>(ENDPOINTS.EMPRESAS.PUBLICA(id));
  },

  /** Elimina una empresa (superadmin). */
  async eliminar(id: number | string): Promise<void> {
    await apiClient.delete(ENDPOINTS.EMPRESAS.ELIMINAR(id));
  },
};
