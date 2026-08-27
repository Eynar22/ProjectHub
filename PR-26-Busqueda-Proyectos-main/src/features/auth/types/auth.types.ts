/* ============================================================================
 * src/features/auth/types/auth.types.ts
 * Formas de datos que se ENVÍAN y RECIBEN en los endpoints de autenticación
 * (AuthController). Sufijo Dto = lo que envías; sin sufijo = lo que recibes.
 * ========================================================================= */

import type { User } from '@/shared/types/user.types';

export interface LoginDto {
  correo: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

/** Resultado normalizado que consume la UI de login. */
export interface LoginResultado {
  success: boolean;
  message?: string;
}

/** Registro de una empresa nueva + su primer usuario (administrador). */
export interface RegistroEmpresaDto {
  correo: string;
  password: string;
  nombre_empresa: string;
  descripcion: string;
  num_empleados: number;
  portafolio: string;
  documento_empresa_url: string;
  nombre_completo: string;
  cargo: string;
  documento_personal_url: string;
}

/** Registro de un empleado que se une a una empresa existente. */
export interface RegistroEmpleadoDto {
  nombre_completo: string;
  correo: string;
  password: string;
  cargo: string;
  documento_url: string;
  empresa_id: number;
}
