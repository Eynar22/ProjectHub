/* ============================================================================
 * src/features/empresas/types/empresas.types.ts
 * Espejo de las entidades de empresa del backend (EmpresaController).
 * Si el backend cambia una entidad, este archivo se actualiza primero.
 * ========================================================================= */

import type { User } from '@/shared/types/user.types';

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

/** Solicitud de un usuario para unirse a una empresa. */
export interface MemberRequest {
  id: number;
  empresa_id: number;
  usuario_id: number;
  usuario?: User;
  documento_url?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_creacion: string;
}

/** Datos del registrante al crear una empresa (formulario de registro). */
export interface CompanyRegistrant {
  name: string;
  jobTitle: string;
  email: string;
}

/** Campos parciales que se ENVÍAN al actualizar una empresa. */
export type ActualizarCompanyDto = Partial<Company> & {
  imagenes_urls?: string[];
  enlaces?: { url: string; nombre?: string }[];
};
