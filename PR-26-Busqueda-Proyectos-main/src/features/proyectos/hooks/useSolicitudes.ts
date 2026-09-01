/* ============================================================================
 * src/features/proyectos/hooks/useSolicitudes.ts
 * Solicitudes de participación en proyectos (Anexo B9).
 * ========================================================================= */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { solicitudesService } from '../services/solicitudes.service';
import { PROYECTOS_KEYS } from './useProyectos';
import type { CrearSolicitudInput } from '../types/proyectos.types';

export const SOLICITUDES_KEYS = {
  todas: ['solicitudes-proyecto'] as const,
  enviadas: () => [...SOLICITUDES_KEYS.todas, 'enviadas'] as const,
  porProyecto: (id: number | string) =>
    [...SOLICITUDES_KEYS.todas, 'proyecto', String(id)] as const,
};

const REFETCH_MS = 60_000;

/** Solicitudes que el usuario actual envió. Solo si hay sesión. */
export function useSolicitudesEnviadas(habilitado = true) {
  return useQuery({
    queryKey: SOLICITUDES_KEYS.enviadas(),
    queryFn: () => solicitudesService.listarEnviadas(),
    enabled: habilitado,
    refetchInterval: () => (document.hidden ? false : REFETCH_MS),
  });
}

/** Solicitudes recibidas en un proyecto propio. */
export function useSolicitudesDeProyecto(proyectoId: number | string | undefined) {
  return useQuery({
    queryKey: SOLICITUDES_KEYS.porProyecto(proyectoId ?? ''),
    queryFn: () => solicitudesService.listarPorProyecto(proyectoId!),
    enabled: proyectoId != null && proyectoId !== '',
  });
}

/** Crea una solicitud de participación. */
export function useCrearSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proyectoId, ...datos }: { proyectoId: number } & CrearSolicitudInput) =>
      solicitudesService.crear(proyectoId, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOLICITUDES_KEYS.enviadas() });
      toast.success('Tu solicitud fue enviada');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la solicitud');
    },
  });
}

/** Acepta o rechaza una solicitud recibida. */
export function useResponderSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ solicitudId, accion }: { solicitudId: number; accion: 'aceptar' | 'rechazar' }) =>
      accion === 'aceptar'
        ? solicitudesService.aceptar(solicitudId)
        : solicitudesService.rechazar(solicitudId),
    onSuccess: (_data, { accion }) => {
      queryClient.invalidateQueries({ queryKey: SOLICITUDES_KEYS.todas });
      queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.todos });
      toast.success(accion === 'aceptar' ? 'Solicitud aceptada' : 'Solicitud rechazada');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar la solicitud');
    },
  });
}
