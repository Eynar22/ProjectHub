/* ============================================================================
 * src/features/proyectos/hooks/useProyectos.ts
 *
 * Conecta el servicio de proyectos con React (Anexo B9). Maneja carga, error,
 * caché e invalidación. El componente solo consume.
 * ========================================================================= */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { proyectosService } from '../services/proyectos.service';
import type {
  CrearProjectDto,
  ProjectEstado,
} from '../types/proyectos.types';

/** Claves de caché de la feature. Centralizadas para invalidar sin errores. */
export const PROYECTOS_KEYS = {
  todos: ['proyectos'] as const,
  lista: () => [...PROYECTOS_KEYS.todos, 'lista'] as const,
  archivados: () => [...PROYECTOS_KEYS.todos, 'archivados'] as const,
  detalle: (id: number | string) => [...PROYECTOS_KEYS.todos, 'detalle', String(id)] as const,
};

/** Re-descarga cada 30 s si la pestaña está visible (sustituye al polling manual). */
const REFETCH_MS = 30_000;

/** Lista de proyectos activos. */
export function useProyectos() {
  return useQuery({
    queryKey: PROYECTOS_KEYS.lista(),
    queryFn: () => proyectosService.listar(),
    refetchInterval: () => (document.hidden ? false : REFETCH_MS),
  });
}

/** Proyectos archivados. Solo se pide si `habilitado` (hay sesión). */
export function useProyectosArchivados(habilitado = true) {
  return useQuery({
    queryKey: PROYECTOS_KEYS.archivados(),
    queryFn: () => proyectosService.listarArchivados(),
    enabled: habilitado,
    refetchInterval: () => (document.hidden ? false : REFETCH_MS),
  });
}

/** Un proyecto por id, con todas sus relaciones. */
export function useProyecto(id: number | string | undefined) {
  return useQuery({
    queryKey: PROYECTOS_KEYS.detalle(id ?? ''),
    queryFn: () => proyectosService.obtenerPorId(id!),
    enabled: id != null && id !== '',
  });
}

/** Crea un proyecto e invalida la lista para que se refresque sola. */
export function useCrearProyecto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearProjectDto) => proyectosService.crear(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.todos });
      toast.success('Proyecto creado exitosamente');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al crear el proyecto');
    },
  });
}

const MENSAJE_ESTADO: Record<ProjectEstado, string> = {
  archivado: 'Proyecto archivado correctamente',
  terminado: 'Proyecto marcado como terminado',
  en_curso: 'Proyecto reactivado correctamente',
};

/** Cambia el estado del proyecto e invalida listas + detalle. */
export function useCambiarEstadoProyecto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: ProjectEstado }) =>
      proyectosService.cambiarEstado(id, estado),
    onSuccess: (_data, { id, estado }) => {
      queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.todos });
      queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.detalle(id) });
      toast.success(MENSAJE_ESTADO[estado]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado');
    },
  });
}

/** Termina automáticamente los proyectos vencidos (acción de admin). */
export function useAutoTerminarProyectos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => proyectosService.autoTerminar(),
    onSuccess: ({ actualizados }) => {
      queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.todos });
      toast.success(`Proyectos terminados automáticamente: ${actualizados}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo ejecutar la acción');
    },
  });
}

/** Transfiere la propiedad de un proyecto a otro usuario. */
export function useTransferirProyecto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nuevoCreadorId }: { id: number; nuevoCreadorId: number }) =>
      proyectosService.transferir(id, nuevoCreadorId),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.todos });
      queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.detalle(id) });
      toast.success('Proyecto transferido exitosamente');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al transferir el proyecto');
    },
  });
}
