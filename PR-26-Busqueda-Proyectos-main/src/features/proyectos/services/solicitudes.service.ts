/* ============================================================================
 * src/features/proyectos/services/solicitudes.service.ts
 *
 * Solicitudes de PARTICIPACIÓN en proyectos. El backend las expone bajo el
 * controlador de proyectos, por eso viven en esta feature.
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { subirArchivo } from './archivos';
import type { Request, CrearSolicitudInput } from '../types/proyectos.types';

export const solicitudesService = {
  /** Solicitudes que el usuario actual ha enviado a proyectos ajenos. */
  async listarEnviadas(): Promise<Request[]> {
    return apiClient.get<Request[]>(ENDPOINTS.PROYECTOS.SOLICITUDES_ENVIADAS);
  },

  /**
   * Solicitudes pendientes recibidas en los proyectos del usuario, agrupadas
   * por proyecto. La forma exacta la define el consumidor.
   */
  async listarPendientesAgrupadas<T = unknown>(): Promise<T[]> {
    return apiClient.get<T[]>(ENDPOINTS.PROYECTOS.SOLICITUDES_PENDIENTES);
  },

  /** Solicitudes recibidas en un proyecto propio. */
  async listarPorProyecto(proyectoId: number | string): Promise<Request[]> {
    return apiClient.get<Request[]>(ENDPOINTS.PROYECTOS.SOLICITUDES_POR_PROYECTO(proyectoId));
  },

  /**
   * Crea una solicitud de participación en un proyecto. Los postulantes
   * independientes adjuntan además una propuesta de solución y su CV, que se
   * suben al backend (disco) y quedan como ruta `/api/archivos/...`.
   */
  async crear(proyectoId: number | string, datos: CrearSolicitudInput): Promise<Request> {
    const [cv_url, propuesta_url] = await Promise.all([
      datos.cv ? subirArchivo(datos.cv) : undefined,
      datos.propuestaArchivo ? subirArchivo(datos.propuestaArchivo) : undefined,
    ]);

    return apiClient.post<Request>(ENDPOINTS.PROYECTOS.CREAR_SOLICITUD(proyectoId), {
      mensaje: datos.mensaje,
      propuesta: datos.propuesta,
      propuesta_url,
      cv_url,
    });
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
