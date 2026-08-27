/* ============================================================================
 * src/features/proyectos/types/proyectos.types.ts
 * Espejo de las entidades de proyecto del backend (ProyectoController).
 * ========================================================================= */

import type { User } from '@/shared/types/user.types';

export type ProjectEstado = 'en_curso' | 'terminado' | 'archivado';

/** Recurso (archivo o carpeta) dentro del espacio de trabajo de un proyecto. */
export interface Resource {
  id: number;
  proyecto_id: number;
  nombre: string;
  tipo: 'archivo' | 'carpeta';
  url?: string;
  padre_id?: number | null;
  fecha_creacion: string;
}

/** Proyecto tal como lo devuelve el backend. */
export interface Project {
  id: number;
  nombre: string;
  descripcion_corta?: string;
  descripcion_completa?: string;
  categoria: string;
  imagenes: { id: number; url: string }[];
  fecha_inicio: string;
  fecha_fin: string;
  financiamiento?: number;
  documento_url?: string;
  creador_id: number;
  creador?: User;
  estado: ProjectEstado;
  suspendido?: boolean;
  participantes?: { usuario_id: number; rol: string; usuario: User }[];
  recursos?: Resource[];
  fecha_creacion?: string;
}

/** Solicitud de participación de un usuario en un proyecto. */
export interface Request {
  id: number;
  proyecto_id: number;
  usuario_id: number;
  mensaje: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  fecha_creacion: string;
  usuario?: User;
}

/** Datos que se ENVÍAN al crear un proyecto (antes de subir archivos). */
export interface CrearProjectDto {
  name: string;
  shortDescription?: string;
  description?: string;
  categoria?: string;
  startDate: string;
  endDate: string;
  funding?: string | number;
  createdByUserId: number;
  imageFiles?: File[];
  pdfFiles?: File[];
}

/** Todos los campos opcionales: es un PATCH, no un PUT. */
export type ActualizarProjectDto = Partial<Project>;
