/* ============================================================================
 * src/features/workspace/hooks/useTareas.ts
 * Tablero kanban de un proyecto (Anexo B9).
 * ========================================================================= */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tareasService } from '../services/tareas.service';
import type { Task } from '../types/workspace.types';

export const TAREAS_KEYS = {
  todas: ['tareas'] as const,
  columnas: (proyectoId: number | string) =>
    [...TAREAS_KEYS.todas, 'columnas', String(proyectoId)] as const,
  lista: (proyectoId: number | string) =>
    [...TAREAS_KEYS.todas, 'lista', String(proyectoId)] as const,
};

export function useColumnasProyecto(proyectoId: number | string | undefined) {
  return useQuery({
    queryKey: TAREAS_KEYS.columnas(proyectoId ?? ''),
    queryFn: () => tareasService.listarColumnas(proyectoId!),
    enabled: proyectoId != null && proyectoId !== '',
  });
}

export function useTareasProyecto(proyectoId: number | string | undefined) {
  return useQuery({
    queryKey: TAREAS_KEYS.lista(proyectoId ?? ''),
    queryFn: () => tareasService.listarPorProyecto(proyectoId!),
    enabled: proyectoId != null && proyectoId !== '',
  });
}

export function useCrearTarea(proyectoId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: Record<string, unknown>) => tareasService.crear(datos),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.lista(proyectoId) }),
  });
}

export function useActualizarTarea(proyectoId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Partial<Task> }) =>
      tareasService.actualizar(id, datos),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.lista(proyectoId) }),
  });
}

export function useEliminarTarea(proyectoId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tareasService.eliminar(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.lista(proyectoId) }),
  });
}

export function useAgregarComentario(proyectoId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tareaId, texto }: { tareaId: number; texto: string }) =>
      tareasService.agregarComentario(tareaId, texto),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.lista(proyectoId) }),
  });
}
