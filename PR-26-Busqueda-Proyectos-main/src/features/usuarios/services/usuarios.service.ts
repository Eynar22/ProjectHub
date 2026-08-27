/* ============================================================================
 * src/features/usuarios/services/usuarios.service.ts
 *
 * Responsabilidad: hablar con los endpoints de usuarios del backend.
 * NO maneja estado. NO muestra toasts. NO conoce React.
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { User } from '@/shared/types/user.types';
import type { MemberRequest } from '@/shared/types/member-request.types';
import type { ActualizarPerfilDto, AccionUsuario } from '../types/usuarios.types';

export const usuariosService = {
  /** Todos los usuarios de la plataforma (admin). */
  async listar(): Promise<User[]> {
    return apiClient.get<User[]>(ENDPOINTS.USUARIOS.LISTAR);
  },

  /** Un usuario por id, con sus campos completos (documento_url, etc.). */
  async obtenerPorId(id: number | string): Promise<User> {
    return apiClient.get<User>(ENDPOINTS.USUARIOS.DETALLE(id));
  },

  /** Actualiza el perfil del usuario autenticado. */
  async actualizarPerfil(datos: ActualizarPerfilDto): Promise<User> {
    return apiClient.patch<User>(ENDPOINTS.USUARIOS.ME, datos);
  },

  /** Modera un usuario (promover / degradar / bloquear / desbloquear / eliminar). */
  async moderar(id: number | string, accion: AccionUsuario): Promise<void> {
    if (accion === 'eliminar') {
      await apiClient.delete(ENDPOINTS.USUARIOS.ELIMINAR(id));
      return;
    }
    const rutas: Record<Exclude<AccionUsuario, 'eliminar'>, string> = {
      promover: ENDPOINTS.USUARIOS.PROMOVER(id),
      degradar: ENDPOINTS.USUARIOS.DEGRADAR(id),
      bloquear: ENDPOINTS.USUARIOS.BLOQUEAR(id),
      desbloquear: ENDPOINTS.USUARIOS.DESBLOQUEAR(id),
    };
    await apiClient.patch(rutas[accion], {});
  },

  // ── Solicitudes de membresía a una empresa ─────────────────────────────
  /** Solicitudes de membresía recibidas por una empresa. */
  async listarSolicitudesMembresia(empresaId: number | string): Promise<MemberRequest[]> {
    return apiClient.get<MemberRequest[]>(ENDPOINTS.USUARIOS.SOLICITUDES_EMPRESA(empresaId));
  },

  /** Acepta o rechaza una solicitud de membresía. */
  async responderSolicitudMembresia(
    solicitudId: number | string,
    accion: 'aprobar' | 'rechazar',
  ): Promise<void> {
    const ruta =
      accion === 'aprobar'
        ? ENDPOINTS.USUARIOS.APROBAR_SOLICITUD(solicitudId)
        : ENDPOINTS.USUARIOS.RECHAZAR_SOLICITUD(solicitudId);
    await apiClient.patch(ruta, {});
  },

  /** Elimina el registro de una solicitud de membresía. */
  async eliminarSolicitudMembresia(solicitudId: number | string): Promise<void> {
    await apiClient.delete(ENDPOINTS.USUARIOS.ELIMINAR_SOLICITUD(solicitudId));
  },
};
