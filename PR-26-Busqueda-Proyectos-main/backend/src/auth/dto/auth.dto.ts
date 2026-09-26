import { Allow } from 'class-validator';
import { Type } from 'class-transformer';

/* Los DTOs solo declaran la forma del body (tipos + @Allow para que el
 * ValidationPipe global con whitelist no los borre). Las reglas de cada campo
 * viven en common/validacion/esquemas.ts y se aplican en el controller con
 * `@Body(new ValidarCampos(ESQUEMA_...))`. */

export class LoginDto {
  @Allow() correo: string;
  @Allow() password: string;
}

export class RegisterEmpresaDto {
  // Datos de la empresa
  @Allow() nombre_empresa: string;
  @Allow() descripcion?: string;
  @Allow() @Type(() => Number) num_empleados?: number;
  @Allow() portafolio?: string;
  @Allow() documento_empresa_url?: string;
  @Allow() logo_url?: string;
  @Allow() imagenes_urls?: string[];
  // Datos del admin
  @Allow() nombre_completo: string;
  @Allow() cargo?: string;
  @Allow() correo: string;
  @Allow() password: string;
  @Allow() documento_personal_url?: string;
}

export class RegisterEmpleadoDto {
  @Allow() nombre_completo: string;
  @Allow() cargo?: string;
  @Allow() correo: string;
  @Allow() password: string;
  @Allow() documento_url?: string;
  @Allow() @Type(() => Number) empresa_id: number;
}

/** Registro de un usuario independiente, sin empresa. Acceso inmediato. */
export class RegisterIndependienteDto {
  @Allow() nombre_completo: string;
  @Allow() cargo?: string;
  @Allow() correo: string;
  @Allow() password: string;
  @Allow() documento_url?: string;
}

export class ForgotPasswordDto {
  @Allow() correo: string;
}

export class VerifyResetCodeDto {
  @Allow() correo: string;
  @Allow() codigo: string;
}

export class ResetPasswordDto {
  @Allow() correo: string;
  @Allow() codigo: string;
  @Allow() nueva_password: string;
}

export class ChangePasswordDto {
  @Allow() password_actual: string;
  @Allow() password_nueva: string;
}
