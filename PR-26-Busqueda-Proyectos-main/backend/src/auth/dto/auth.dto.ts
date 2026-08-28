import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterEmpresaDto {
  // Datos de la empresa
  @IsString()
  @IsNotEmpty()
  nombre_empresa: string;

  @IsString()
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  num_empleados?: number;

  @IsString()
  portafolio?: string;

  @IsString()
  documento_empresa_url?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  // Datos del admin
  @IsString()
  @IsNotEmpty()
  nombre_completo: string;

  @IsString()
  cargo?: string;

  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsString()
  documento_personal_url?: string;
}

export class RegisterEmpleadoDto {
  @IsString()
  @IsNotEmpty()
  nombre_completo: string;

  @IsString()
  cargo?: string;

  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsString()
  documento_url?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  empresa_id: number;
}

/** Registro de un usuario independiente, sin empresa. Acceso inmediato. */
export class RegisterIndependienteDto {
  @IsString()
  @IsNotEmpty()
  nombre_completo: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsOptional()
  @IsString()
  documento_url?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  correo: string;
}

export class VerifyResetCodeDto {
  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;
}

export class ResetPasswordDto {
  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @MinLength(4)
  nueva_password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  password_actual: string;

  @IsString()
  @MinLength(4)
  password_nueva: string;
}
