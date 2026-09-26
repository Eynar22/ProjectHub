import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/* Red de seguridad: si un dato inválido llega hasta Postgres (texto más largo
 * que la columna, número fuera de rango, duplicado...), TypeORM lanza un
 * QueryFailedError que Nest devolvería como 500 "Internal server error".
 * Aquí lo traducimos a un 4xx con un mensaje que el usuario pueda entender. */

// Nombres legibles de columnas para los mensajes.
const ETIQUETAS: Record<string, string> = {
  nombre: 'El nombre',
  nombre_completo: 'El nombre completo',
  cargo: 'El cargo',
  correo: 'El correo',
  descripcion: 'La descripción',
  descripcion_corta: 'La descripción corta',
  portafolio: 'El portafolio',
  categoria: 'La categoría',
  titulo: 'El título',
  prioridad: 'La prioridad',
  estado: 'El estado',
  rol: 'El rol',
  financiamiento: 'El financiamiento',
  num_empleados: 'El número de empleados',
};

@Catch(QueryFailedError)
export class ErroresBdFilter implements ExceptionFilter {
  private readonly logger = new Logger('ErroresBd');

  catch(
    exception: QueryFailedError & { driverError?: any },
    host: ArgumentsHost,
  ) {
    const res = host.switchToHttp().getResponse<Response>();
    const err = exception.driverError ?? exception;
    const code: string | undefined = err?.code;
    const columna: string | undefined = err?.column;
    const etiqueta = (columna && ETIQUETAS[columna]) || 'Uno de los campos';

    let status = HttpStatus.BAD_REQUEST;
    let message: string;

    switch (code) {
      case '22001': {
        // value too long for type character varying(n)
        const max = /varying\((\d+)\)/.exec(err?.message ?? '')?.[1];
        message = max
          ? `${etiqueta} es demasiado largo: el máximo es ${max} caracteres.`
          : `${etiqueta} es demasiado largo.`;
        break;
      }
      case '22003':
        message = `${etiqueta === 'Uno de los campos' ? 'Uno de los números' : etiqueta} está fuera del rango permitido.`;
        break;
      case '22007':
      case '22008':
        message = 'Una de las fechas no es válida.';
        break;
      case '22P02':
        message =
          'Uno de los campos tiene un formato no válido (se esperaba un número, fecha u otro tipo).';
        break;
      case '23502':
        message = `${etiqueta} es obligatorio.`;
        break;
      case '23505':
        status = HttpStatus.CONFLICT;
        message = /correo/.test(err?.detail ?? err?.constraint ?? '')
          ? 'Ya existe una cuenta con ese correo.'
          : 'Ya existe un registro con esos datos.';
        break;
      case '23503':
        status = HttpStatus.CONFLICT;
        message = 'El registro relacionado no existe o todavía está en uso.';
        break;
      default:
        this.logger.error(exception.message, exception.stack);
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message =
          'Ocurrió un error en el servidor. Intenta de nuevo en unos minutos.';
    }

    if (status !== HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.warn(`${code} ${columna ?? ''}: ${exception.message}`);
    }
    res.status(status).json({ statusCode: status, message });
  }
}
