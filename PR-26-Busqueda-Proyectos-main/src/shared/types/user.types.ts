/* ============================================================================
 * src/shared/types/user.types.ts
 * Entidad Usuario. Vive en /shared porque la usan varias features
 * (auth, usuarios, empresas, proyectos, workspace). Espejo del backend.
 * ========================================================================= */

export type UserRole = 'superadmin' | 'admin' | 'empleado';

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
