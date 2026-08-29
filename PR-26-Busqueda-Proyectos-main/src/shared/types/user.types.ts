/* ============================================================================
 * src/shared/types/user.types.ts
 * Entidad Usuario. Vive en /shared porque la usan varias features
 * (auth, usuarios, empresas, proyectos, workspace). Espejo del backend.
 * ========================================================================= */

/**
 * 'colaborador': usuario sin empresa que fue aceptado en al menos un proyecto.
 * Colabora en proyectos de cualquier empresa sin llegar a pertenecer a ninguna.
 * Un 'empleado' sin empresa_id es un independiente que todavía no fue aceptado
 * en ningún proyecto. Ver esIndependiente() en @/shared/utils/roles.
 */
export type UserRole = 'superadmin' | 'admin' | 'empleado' | 'colaborador';

/** Usuario tal como lo devuelve el backend. */
export interface User {
  id: number;
  correo: string;
  nombre_completo: string;
  /** Cargo / posición dentro de la empresa. */
  cargo?: string;
  rol: UserRole;
  empresa_id?: number | null;
  estado?: string;
  documento_url?: string;
  foto_url?: string;
  empresa?: { id: number; nombre: string };
  onboarding_completado?: boolean;
  debe_cambiar_password?: boolean;
}
