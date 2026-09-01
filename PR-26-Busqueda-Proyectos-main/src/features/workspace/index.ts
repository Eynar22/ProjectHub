/* Punto de entrada público de la feature workspace (espacio de trabajo). */
export { tareasService } from './services/tareas.service';
export { chatService } from './services/chat.service';
export { recursosService } from './services/recursos.service';
export {
  TAREAS_KEYS,
  useColumnasProyecto,
  useTareasProyecto,
  useTareaDetalle,
  useCrearTarea,
  useActualizarTarea,
  useEliminarTarea,
  useAgregarComentario,
} from './hooks/useTareas';
export { CHAT_KEYS, useMensajesChat, useEnviarMensaje } from './hooks/useChat';
export {
  RECURSOS_KEYS,
  useRecursos,
  useCrearRecurso,
  useEliminarRecurso,
  useSubirArchivo,
} from './hooks/useRecursos';
export type {
  Task,
  TaskComment,
  TaskPrioridad,
  KanbanColumn,
  Message,
} from './types/workspace.types';
