/* ============================================================================
 * src/lib/api/errors.ts
 * Convierte cualquier fallo (red, timeout, error de NestJS) en un ÚNICO
 * formato. El resto del proyecto solo conoce ApiError (Anexo B8).
 * ========================================================================= */

export interface ApiError {
  /** Código HTTP, o 0 si el fallo fue de red / timeout. */
  status: number;
  /** Mensaje ya listo para mostrar al usuario, en español. */
  mensaje: string;
  /** Errores por campo, para pintar en formularios. */
  camposConError?: Record<string, string>;
}

/** Mensajes por defecto según el código HTTP. Nunca mostramos texto técnico. */
const MENSAJES_POR_STATUS: Record<number, string> = {
  0: 'No pudimos conectar con el servidor. Revisa tu conexión.',
  400: 'Los datos enviados no son válidos.',
  401: 'Tu sesión expiró. Inicia sesión de nuevo.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscabas.',
  409: 'Esta operación entra en conflicto con datos existentes.',
  413: 'El archivo es demasiado grande para subirlo. Reduce su tamaño e intenta de nuevo.',
  422: 'Revisa los campos marcados.',
  500: 'Ocurrió un error en el servidor. Intenta de nuevo en unos minutos.',
};

export class ApiErrorClass extends Error implements ApiError {
  status: number;
  mensaje: string;
  camposConError?: Record<string, string>;

  constructor(error: ApiError) {
    super(error.mensaje);
    this.name = 'ApiError';
    this.status = error.status;
    this.mensaje = error.mensaje;
    this.camposConError = error.camposConError;
  }
}

/** Body de error tal como lo devuelve NestJS (class-validator, HttpException). */
interface CuerpoErrorBackend {
  message?: string | string[];
  errors?: Record<string, string>;
}

/**
 * Normaliza la respuesta de fetch. `status` es 0 cuando no hubo respuesta
 * (fallo de red o timeout). `cuerpo` es el JSON del backend si vino.
 */
export function normalizarError(status: number, cuerpo: CuerpoErrorBackend | null): ApiErrorClass {
  const mensajeBackend = Array.isArray(cuerpo?.message)
    ? cuerpo?.message.join(', ')
    : cuerpo?.message;

  return new ApiErrorClass({
    // Prioridad: mensaje del backend > mensaje por status > genérico.
    mensaje:
      mensajeBackend ||
      MENSAJES_POR_STATUS[status] ||
      'Ocurrió un error inesperado.',
    status,
    camposConError: cuerpo?.errors,
  });
}
