/* ============================================================================
 * src/shared/types/member-request.types.ts
 * Solicitud de un usuario para unirse a una empresa. La usan las features
 * empresas y usuarios, por eso vive en /shared (Anexo B3). El backend la
 * expone bajo el controlador de usuarios.
 * ========================================================================= */

import type { User } from './user.types';

export type MemberRequestEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface MemberRequest {
  id: number;
  empresa_id: number;
  usuario_id: number;
  usuario?: User;
  documento_url?: string;
  estado: MemberRequestEstado;
  fecha_creacion: string;
}
