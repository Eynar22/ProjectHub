/* ============================================================================
 * src/features/usuarios/types/usuarios.types.ts
 * Espejo de las entidades/DTOs del backend de usuarios (UsuarioController).
 * La entidad User vive en /shared porque la usan varias features.
 * ========================================================================= */

export type { User, UserRole } from '@/shared/types/user.types';
export type { MemberRequest, MemberRequestEstado } from '@/shared/types/member-request.types';

/** Campos que el usuario puede editar de su propio perfil. */
export interface ActualizarPerfilDto {
  nombre_completo?: string;
  cargo?: string;
  foto_url?: string;
}

/** Acciones de moderación de usuarios (superadmin / admin de empresa). */
export type AccionUsuario =
  | 'promover'
  | 'degradar'
  | 'bloquear'
  | 'desbloquear'
  | 'eliminar';
