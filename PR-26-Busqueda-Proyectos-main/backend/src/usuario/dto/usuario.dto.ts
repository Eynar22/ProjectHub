import { Allow } from 'class-validator';
import { Type } from 'class-transformer';

// Alta rápida de empleado desde el wizard de bienvenida del admin: se crea
// directo activo (el admin lo está dando de alta, no pasa por solicitud de
// membresía) con una contraseña temporal que se le envía por correo.
// Reglas de los campos: ESQUEMA_ALTA_RAPIDA en common/validacion/esquemas.ts.
export class QuickCreateEmpleadoDto {
  @Allow() nombre_completo: string;
  @Allow() correo: string;
  @Allow() cargo?: string;
  @Allow() @Type(() => Number) proyecto_id?: number;
}
