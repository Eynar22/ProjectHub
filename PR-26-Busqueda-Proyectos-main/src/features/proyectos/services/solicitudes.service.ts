/* ============================================================================
 * src/features/proyectos/services/solicitudes.service.ts
 *
 * Solicitudes de PARTICIPACIÓN en proyectos. El backend las expone bajo el
 * controlador de proyectos, por eso viven en esta feature.
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { Request } from '../types/proyectos.types';

export const solicitudesService = {
  /** Solicitudes que el usuario actual ha enviado a proyectos ajenos. */
  async listarEnviadas(): Promise<Request[]> {
    return apiClient.get<Request[]>(ENDPOINTS.PROYECTOS.SOLICITUDES_ENVIADAS);
  },

  /** Solicitudes recibidas en un proyecto propio. */
  async listarPorProyecto(proyectoId: number | string): Promise<Request[]> {
    return apiClient.get<Request[]>(ENDPOINTS.PROYECTOS.SOLICITUDES_POR_PROYECTO(proyectoId));
  },

  /** Crea una solicitud de participación en un proyecto. */
  async crear(proyectoId: number | string, mensaje: string): Promise<Request> {
    return apiClient.post<Request>(ENDPOINTS.PROYECTOS.CREAR_SOLICITUD(proyectoId), { mensaje });
  },

  /** Acepta una solicitud recibida. */
  async aceptar(solicitudId: number | string): Promise<void> {
    await apiClient.patch(ENDPOINTS.PROYECTOS.ACEPTAR_SOLICITUD(solicitudId), {});
  },

  /** Rechaza una solicitud recibida. */
  async rechazar(solicitudId: number | string): Promise<void> {
    await apiClient.patch(ENDPOINTS.PROYECTOS.RECHAZAR_SOLICITUD(solicitudId), {});
  },
};
