export type TabType = 'info' | 'team' | 'chat' | 'tasks' | 'resources' | 'solicitudes';

export interface ProyectoSolicitud {
  id: number;
  proyecto_id: number;
  usuario_id: number;
  mensaje: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  fecha_creacion: string;
  usuario?: {
    id: number;
    nombre_completo: string;
    correo: string;
    cargo?: string;
    empresa_id?: number;
  };
}

export interface WorkspaceMember {
  id: number;
  nombre_completo: string;
  correo: string;
  cargo?: string;
  empresa_id?: number;
}

export interface WorkspaceChatMessage {
  id: number;
  chat_id: number;
  usuario_id: number;
  contenido: string;
  archivo_url?: string;
  fecha: string;
  usuario?: { nombre_completo: string; cargo?: string };
}

export interface WorkspaceTaskComment {
  id: number;
  usuario_id: number;
  texto: string;
  fecha_creacion: string;
  usuario?: { nombre_completo: string };
}

export interface WorkspaceTask {
  id: number;
  proyecto_id: number;
  columna_id: number;
  usuario_id?: number;
  titulo: string;
  descripcion?: string;
  prioridad: 'baja' | 'media' | 'alta';
  fecha_limite?: string;
  orden: number;
  usuario?: { id: number; nombre_completo: string };
  usuarios?: { id: number; nombre_completo: string }[];
  comentarios?: WorkspaceTaskComment[];
}

export interface KanbanColumn {
  id: number;
  nombre: string;
  orden: number;
}
