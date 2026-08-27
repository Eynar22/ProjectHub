/* ============================================================================
 * src/features/workspace/services/tareas.service.ts
 * Endpoints del tablero kanban de un proyecto (TareaController).
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { Task, TaskComment, KanbanColumn } from '../types/workspace.types';

export const tareasService = {
  /** Columnas del tablero de un proyecto. */
  async listarColumnas(proyectoId: number | string): Promise<KanbanColumn[]> {
    return apiClient.get<KanbanColumn[]>(ENDPOINTS.TAREAS.COLUMNAS_POR_PROYECTO(proyectoId));
  },

  /** Crea una columna del tablero. */
  async crearColumna(datos: {
    proyecto_id: number | string;
    nombre: string;
    orden: number;
  }): Promise<KanbanColumn> {
    return apiClient.post<KanbanColumn>(ENDPOINTS.TAREAS.COLUMNAS, datos);
  },

  /** Tareas de un proyecto. */
  async listarPorProyecto(proyectoId: number | string): Promise<Task[]> {
    return apiClient.get<Task[]>(ENDPOINTS.TAREAS.POR_PROYECTO(proyectoId));
  },

  /** Crea una tarea. */
  async crear(datos: Record<string, unknown>): Promise<Task> {
    return apiClient.post<Task>(ENDPOINTS.TAREAS.CREAR, datos);
  },

  /** Actualiza campos parciales de una tarea (título, columna, orden,
   * usuario_ids de la relación ManyToMany, etc.). */
  async actualizar(
    id: number | string,
    datos: Partial<Task> & Record<string, unknown>,
  ): Promise<Task> {
    return apiClient.patch<Task>(ENDPOINTS.TAREAS.ACTUALIZAR(id), datos);
  },

  /** Elimina una tarea. */
  async eliminar(id: number | string): Promise<void> {
    await apiClient.delete(ENDPOINTS.TAREAS.ELIMINAR(id));
  },

  /** Agrega un comentario a una tarea. */
  async agregarComentario(tareaId: number | string, texto: string): Promise<TaskComment> {
    return apiClient.post<TaskComment>(ENDPOINTS.TAREAS.COMENTARIOS(tareaId), { texto });
  },
};
