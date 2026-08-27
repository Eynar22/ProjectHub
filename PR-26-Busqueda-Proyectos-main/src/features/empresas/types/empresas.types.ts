/* ============================================================================
 * src/features/empresas/types/empresas.types.ts
 * Espejo de las entidades de empresa del backend (EmpresaController).
 * Si el backend cambia una entidad, este archivo se actualiza primero.
 * ========================================================================= */

import type { User } from '@/shared/types/user.types';

/** Re-export por compatibilidad; el tipo vive en /shared. */
export type { MemberRequest, MemberRequestEstado } from '@/shared/types/member-request.types';

export interface CompanyImagen {
  id: number;
  url: string;
}

export interface CompanyEnlace {
  id: number;
  url: string;
  nombre?: string;
}

export type CompanyEstado = 'pendiente' | 'aprobado' | 'bloqueado' | 'rechazado';

/** Empresa tal como la devuelve el backend. */
export interface Company {
  id: number;
  nombre: string;
  descripcion: string;
  num_empleados: number;
  portafolio: string;
  contacto: string;
  estado: CompanyEstado;
  fecha_creacion: string;
  logo_url?: string;
  documento_url?: string;
  fecha_registro?: string;
  fecha_aprobacion?: string;
  usuarios?: User[];
  imagenes?: CompanyImagen[];
  enlaces?: CompanyEnlace[];
}

/** Datos del registrante al crear una empresa (formulario de registro). */
export interface CompanyRegistrant {
  name: string;
  jobTitle: string;
  email: string;
}

/** Campos parciales que se ENVÍAN al actualizar una empresa.
 * `imagenes`/`enlaces` de la entidad se sustituyen por las formas de envío. */
export type ActualizarCompanyDto = Partial<Omit<Company, 'imagenes' | 'enlaces'>> & {
  imagenes_urls?: string[];
  enlaces?: { url: string; nombre?: string }[];
};
