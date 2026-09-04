/* ============================================================================
 * src/features/workspace/hooks/useRecursos.ts
 * Recursos de proyecto y subida de archivos (Anexo B9).
 * ========================================================================= */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { recursosService } from '../services/recursos.service';
import { PROYECTOS_KEYS } from '@/features/proyectos';

export const RECURSOS_KEYS = {
  todos: ['recursos'] as const,
};

export function useRecursos() {
  return useQuery({
    queryKey: RECURSOS_KEYS.todos,
    queryFn: () => recursosService.listar(),
  });
}

/** El árbol de recursos del proyecto se re-descarga tras crear/eliminar. */
export function useCrearRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: Record<string, unknown>) => recursosService.crear(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURSOS_KEYS.todos });
      queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.todos });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el recurso');
    },
  });
}

export function useEliminarRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recursosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURSOS_KEYS.todos });
      queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.todos });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el recurso');
    },
  });
}

/** Sube un archivo y devuelve `{ url, filename }` (la url va a la BD). */
export function useSubirArchivo() {
  return useMutation({
    mutationFn: (file: File) => recursosService.subirArchivo(file),
  });
}
