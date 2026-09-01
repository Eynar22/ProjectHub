/* ============================================================================
 * src/features/empresas/hooks/useEmpresas.ts
 * Conecta el servicio de empresas con React (Anexo B9).
 * ========================================================================= */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { empresasService } from '../services/empresas.service';
import type { ActualizarCompanyDto } from '../types/empresas.types';

export const EMPRESAS_KEYS = {
  todas: ['empresas'] as const,
  lista: () => [...EMPRESAS_KEYS.todas, 'lista'] as const,
  detalle: (id: number | string) => [...EMPRESAS_KEYS.todas, 'detalle', String(id)] as const,
};

const REFETCH_MS = 60_000;

/** Lista de empresas. */
export function useEmpresas() {
  return useQuery({
    queryKey: EMPRESAS_KEYS.lista(),
    queryFn: () => empresasService.listar(),
    refetchInterval: () => (document.hidden ? false : REFETCH_MS),
  });
}

/** Una empresa por id, con sus relaciones. */
export function useEmpresa(id: number | string | undefined) {
  return useQuery({
    queryKey: EMPRESAS_KEYS.detalle(id ?? ''),
    queryFn: () => empresasService.obtenerPorId(id!),
    enabled: id != null && id !== '',
  });
}

/** Actualiza una empresa e invalida lista + detalle. */
export function useActualizarEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarCompanyDto }) =>
      empresasService.actualizar(id, datos),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: EMPRESAS_KEYS.todas });
      queryClient.invalidateQueries({ queryKey: EMPRESAS_KEYS.detalle(id) });
      toast.success('Empresa actualizada');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la empresa');
    },
  });
}

type AccionModeracion = 'aprobar' | 'bloquear' | 'desbloquear' | 'eliminar';

const MENSAJE_MODERACION: Record<AccionModeracion, string> = {
  aprobar: 'Empresa aprobada',
  bloquear: 'Empresa bloqueada',
  desbloquear: 'Empresa desbloqueada',
  eliminar: 'Empresa eliminada',
};

/** Modera una empresa (aprobar / bloquear / desbloquear / eliminar). */
export function useModerarEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accion }: { id: number; accion: AccionModeracion }) =>
      empresasService[accion](id),
    onSuccess: (_data, { accion }) => {
      queryClient.invalidateQueries({ queryKey: EMPRESAS_KEYS.todas });
      toast.success(MENSAJE_MODERACION[accion]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la acción');
    },
  });
}
