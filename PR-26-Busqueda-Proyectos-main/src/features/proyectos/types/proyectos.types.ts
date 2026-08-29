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
  /** Problema que el proyecto busca resolver. Visible en el detalle público. */
  problema?: string;
  categoria: string;
  /** Ids (1..17) de los ODS de la ONU a los que aporta el proyecto. */
  ods?: number[];
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
  /** Propuesta de solución al problema del proyecto (solo postulantes independientes). */
  propuesta?: string;
  /** Documento de respaldo de la propuesta en base64 (opcional). */
  propuesta_url?: string;
  /** CV del postulante en base64 (solo postulantes independientes). */
  cv_url?: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  fecha_creacion: string;
  usuario?: User;
}

/** Datos que se ENVÍAN al crear una solicitud de participación. */
export interface CrearSolicitudInput {
  mensaje?: string;
  propuesta?: string;
  /** Documento de respaldo de la propuesta; el servicio lo pasa a base64. */
  propuestaArchivo?: File | null;
  /** Archivo de CV; el servicio lo convierte a base64 antes de enviarlo. */
  cv?: File | null;
}

/** Datos que se ENVÍAN al crear un proyecto (antes de subir archivos). */
export interface CrearProjectDto {
  name: string;
  shortDescription?: string;
  description?: string;
  problema?: string;
  categoria?: string;
  /** Ids (1..17) de los ODS a los que aporta el proyecto. */
  ods?: number[];
  startDate: string;
  endDate: string;
  funding?: string | number;
  createdByUserId: number;
  imageFiles?: File[];
  pdfFiles?: File[];
}

/** Todos los campos opcionales: es un PATCH, no un PUT. */
export type ActualizarProjectDto = Partial<Project>;
