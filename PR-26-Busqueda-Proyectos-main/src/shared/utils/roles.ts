/* ============================================================================
 * src/shared/utils/roles.ts
 * Helpers de rol de usuario. Centralizan la definición de "independiente" para
 * que no se repita `rol === 'empleado' && !empresa_id` disperso por la app.
 * ========================================================================= */

/** Acepta cualquier objeto con rol/empresa_id (User, WorkspaceMember, etc.). */
type UsuarioMinimo = { rol?: string | null; empresa_id?: number | null };

/**
 * Un "independiente" es un usuario que no pertenece a ninguna empresa:
 *  - 'colaborador': ya fue aceptado en al menos un proyecto (colabora sin
 *    pertenecer a la empresa dueña), o
 *  - 'empleado' sin empresa_id: se registró como independiente y todavía no
 *    fue aceptado en ningún proyecto.
 * En ambos casos su inicio es Explorar y no tiene panel de empresa.
 */
export function esIndependiente(user?: UsuarioMinimo | null): boolean {
  if (!user) return false;
  if (user.rol === 'colaborador') return true;
  return user.rol === 'empleado' && !user.empresa_id;
}
