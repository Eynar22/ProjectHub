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

/* ── Directorio público (/empresas) ─────────────────────────────────────────
 * Solo datos públicos de empresas aprobadas: sin documento, usuarios ni correos. */

/** Tarjeta del listado público. */
export interface EmpresaPublica {
  id: number;
  nombre: string;
  descripcion?: string | null;
  num_empleados?: number | null;
  portafolio?: string | null;
  logo_url?: string | null;
  fecha_aprobacion?: string | null;
  /** Primera foto de la galería, para la portada de la tarjeta. */
  portada_url?: string | null;
  total_proyectos: number;
  proyectos_activos: number;
  /** ODS (1..17) que trabaja en sus proyectos públicos, sin repetir. */
  ods: number[];
}

/** Proyecto público de una empresa, en su página de detalle. */
export interface ProyectoDeEmpresa {
  id: number;
  nombre: string;
  descripcion_corta?: string | null;
  categoria?: string | null;
  estado: 'en_curso' | 'terminado';
  ods: number[];
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  imagen_url?: string | null;
}

/** Página pública de una empresa. */
export interface EmpresaPublicaDetalle extends Omit<EmpresaPublica, 'ods' | 'portada_url'> {
  imagenes: CompanyImagen[];
  enlaces: CompanyEnlace[];
  proyectos: ProyectoDeEmpresa[];
  /** Cuántos proyectos tiene en cada ODS. */
  ods: { ods: number; proyectos: number }[];
}
