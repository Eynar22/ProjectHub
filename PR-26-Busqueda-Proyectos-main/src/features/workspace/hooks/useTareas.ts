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
  detalle: (tareaId: number | string) =>
    [...TAREAS_KEYS.todas, 'detalle', String(tareaId)] as const,
};

const REFETCH_MS = 30_000;

/** Columnas del tablero; se re-descargan cada 10s para que los cambios de
 * otros usuarios (o de otra pestaña) aparezcan sin recargar la página. */
export function useColumnasProyecto(proyectoId: number | string | undefined) {
  return useQuery({
    queryKey: TAREAS_KEYS.columnas(proyectoId ?? ''),
    queryFn: () => tareasService.listarColumnas(proyectoId!),
    enabled: proyectoId != null && proyectoId !== '',
    refetchInterval: () => (document.hidden ? false : REFETCH_MS),
  });
}

/** Tareas del tablero; mismo polling que las columnas, por la misma razón.
 * NO incluye comentarios (el tablero no los muestra); ver useTareaDetalle. */
export function useTareasProyecto(proyectoId: number | string | undefined) {
  return useQuery({
    queryKey: TAREAS_KEYS.lista(proyectoId ?? ''),
    queryFn: () => tareasService.listarPorProyecto(proyectoId!),
    enabled: proyectoId != null && proyectoId !== '',
    refetchInterval: () => (document.hidden ? false : REFETCH_MS),
  });
}

/** Detalle de una tarea (asignados + comentarios). Se pide al abrir el modal de
 * edición; el listado del tablero ya no incluye comentarios. Sin polling: el
 * modal es efímero y las mutaciones invalidan esta clave. */
export function useTareaDetalle(tareaId: number | string | undefined) {
  return useQuery({
    queryKey: TAREAS_KEYS.detalle(tareaId ?? ''),
    queryFn: () => tareasService.obtener(tareaId!),
    enabled: tareaId != null && tareaId !== '',
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
    mutationFn: ({ id, datos }: { id: number; datos: Partial<Task> & Record<string, unknown> }) =>
      tareasService.actualizar(id, datos),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.lista(proyectoId) });
      queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.detalle(id) });
    },
  });
}

export function useEliminarTarea(proyectoId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tareasService.eliminar(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.lista(proyectoId) });
      queryClient.removeQueries({ queryKey: TAREAS_KEYS.detalle(id) });
    },
  });
}

// El proyectoId ya no se usa (los comentarios solo viven en el detalle de la
// tarea, no en el tablero), pero se mantiene en la firma por consistencia con
// el resto de hooks de mutación de tareas y para no tocar a los que lo llaman.
export function useAgregarComentario(_proyectoId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tareaId, texto }: { tareaId: number; texto: string }) =>
      tareasService.agregarComentario(tareaId, texto),
    onSuccess: (_data, { tareaId }) => {
      queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.detalle(tareaId) });
    },
  });
}
