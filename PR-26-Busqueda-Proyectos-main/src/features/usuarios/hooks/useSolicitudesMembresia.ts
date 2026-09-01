/* ============================================================================
 * src/features/usuarios/hooks/useSolicitudesMembresia.ts
 * Solicitudes de un usuario para unirse a una empresa (Anexo B9).
 * ========================================================================= */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usuariosService } from '../services/usuarios.service';
import { USUARIOS_KEYS } from './useUsuarios';

export const SOLICITUDES_MEMBRESIA_KEYS = {
  todas: ['solicitudes-membresia'] as const,
  porEmpresa: (empresaId: number | string) =>
    [...SOLICITUDES_MEMBRESIA_KEYS.todas, 'empresa', String(empresaId)] as const,
};

const REFETCH_MS = 60_000;

/** Solicitudes de membresía recibidas por una empresa. `enabled` para admins. */
export function useSolicitudesMembresia(empresaId: number | string | undefined, habilitado = true) {
  return useQuery({
    queryKey: SOLICITUDES_MEMBRESIA_KEYS.porEmpresa(empresaId ?? ''),
    queryFn: () => usuariosService.listarSolicitudesMembresia(empresaId!),
    enabled: habilitado && empresaId != null && empresaId !== '',
    refetchInterval: () => (document.hidden ? false : REFETCH_MS),
  });
}

/** Acepta o rechaza una solicitud de membresía. */
export function useResponderSolicitudMembresia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ solicitudId, accion }: { solicitudId: number; accion: 'aprobar' | 'rechazar' }) =>
      usuariosService.responderSolicitudMembresia(solicitudId, accion),
    onSuccess: (_data, { accion }) => {
      queryClient.invalidateQueries({ queryKey: SOLICITUDES_MEMBRESIA_KEYS.todas });
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.todos });
      toast.success(accion === 'aprobar' ? 'Solicitud aprobada' : 'Solicitud rechazada');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar la solicitud');
    },
  });
}

/** Elimina el registro de una solicitud de membresía. */
export function useEliminarSolicitudMembresia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (solicitudId: number) => usuariosService.eliminarSolicitudMembresia(solicitudId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOLICITUDES_MEMBRESIA_KEYS.todas });
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.todos });
      toast.success('Registro eliminado');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el registro');
    },
  });
}
