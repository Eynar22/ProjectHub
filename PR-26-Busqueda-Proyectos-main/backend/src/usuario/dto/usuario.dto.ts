import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// Alta rápida de empleado desde el wizard de bienvenida del admin: se crea
// directo activo (el admin lo está dando de alta, no pasa por solicitud de
// membresía) con una contraseña temporal que se le envía por correo.
export class QuickCreateEmpleadoDto {
  @IsString()
  @IsNotEmpty()
  nombre_completo: string;

  @IsEmail()
  correo: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  proyecto_id?: number;
}
