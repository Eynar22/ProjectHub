/* ============================================================================
 * src/features/workspace/types/workspace.types.ts
 * Espejo de las entidades del espacio de trabajo del backend
 * (TareaController, ChatController).
 * ========================================================================= */

import type { User } from '@/shared/types/user.types';

export type TaskPrioridad = 'baja' | 'media' | 'alta';

export interface TaskComment {
  id: number;
  tarea_id: number;
  usuario_id: number;
  texto: string;
  fecha_creacion: string;
  usuario?: User;
}

/** Tarea del tablero kanban de un proyecto. */
export interface Task {
  id: number;
  proyecto_id: number;
  columna_id: number;
  usuario_id?: number;
  titulo: string;
  descripcion?: string;
  prioridad: TaskPrioridad;
  fecha_limite: string;
  orden: number;
  fecha_creacion: string;
  usuario?: User;
  comentarios?: TaskComment[];
}

/** Columna del tablero kanban de un proyecto. */
export interface KanbanColumn {
  id: number;
  nombre: string;
  orden: number;
}

/** Mensaje del chat de un proyecto. */
export interface Message {
  id: number;
  chat_id: number;
  usuario_id: number;
  contenido: string;
  archivo_url?: string;
  fecha: string;
  usuario?: User;
}
