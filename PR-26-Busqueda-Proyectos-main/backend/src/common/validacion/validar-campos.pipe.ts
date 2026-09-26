import { BadRequestException, PipeTransform } from '@nestjs/common';

/* Validación por campo de TODOS los bodies que ingresa el usuario. Las reglas
 * viven en esquemas.ts; los controllers solo hacen
 * `@Body(new ValidarCampos(ESQUEMA_X)) body`.
 * No borra campos: solo revisa los que conoce y responde 400 con
 * { message: [...], errors: { campo: mensaje } } en español. */

export interface ReglaCampo {
  etiqueta: string;
  tipo?:
    | 'texto'
    | 'numero'
    | 'entero'
    | 'fecha'
    | 'email'
    | 'booleano'
    | 'lista-enteros'
    | 'lista-textos';
  requerido?: boolean;
  /** Longitud mínima/máxima (texto) o valor mínimo/máximo (número). */
  min?: number;
  max?: number;
  valores?: readonly string[];
  patron?: { re: RegExp; mensaje: string };
  /** Fechas: no se permite una anterior a hoy (solo al crear, ver `parcial`). */
  noPasado?: boolean;
}

export type EsquemaCampos = Record<string, ReglaCampo>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}/;

/** Ayer en UTC (YYYY-MM-DD). Se usa ayer y no hoy porque el usuario manda su
 * fecha local y el servidor puede ir un día adelantado (p. ej. México de noche). */
function ayerUTC(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function validarCampo(valor: unknown, r: ReglaCampo, parcial: boolean): string | null {
  const vacio =
    valor === undefined ||
    valor === null ||
    (typeof valor === 'string' && valor.trim() === '');
  if (vacio) return r.requerido ? `${r.etiqueta} es obligatorio.` : null;

  switch (r.tipo ?? 'texto') {
    case 'texto':
    case 'email': {
      if (typeof valor !== 'string') return `${r.etiqueta} debe ser texto.`;
      const s = valor.trim();
      if (r.min !== undefined && s.length < r.min)
        return `${r.etiqueta} debe tener al menos ${r.min} caracteres.`;
      if (r.max !== undefined && valor.length > r.max)
        return `${r.etiqueta} no puede superar ${r.max} caracteres (tiene ${valor.length}).`;
      if (r.tipo === 'email' && !EMAIL_RE.test(s))
        return `${r.etiqueta} no es válido.`;
      if (r.patron && !r.patron.re.test(s))
        return `${r.etiqueta} ${r.patron.mensaje}.`;
      if (r.valores && !r.valores.includes(valor))
        return `${r.etiqueta} debe ser uno de: ${r.valores.join(', ')}.`;
      return null;
    }
    case 'numero':
    case 'entero': {
      const n = typeof valor === 'string' ? Number(valor) : valor;
      if (typeof n !== 'number' || !Number.isFinite(n))
        return `${r.etiqueta} debe ser un número.`;
      if (r.tipo === 'entero' && !Number.isInteger(n))
        return `${r.etiqueta} debe ser un número entero.`;
      if (r.min !== undefined && n < r.min)
        return `${r.etiqueta} no puede ser menor que ${r.min}.`;
      if (r.max !== undefined && n > r.max)
        return `${r.etiqueta} no puede ser mayor que ${r.max.toLocaleString('es-MX')}.`;
      return null;
    }
    case 'fecha':
      if (
        typeof valor !== 'string' ||
        !FECHA_RE.test(valor) ||
        Number.isNaN(Date.parse(valor))
      )
        return `${r.etiqueta} no es válida.`;
      // En updates parciales el front manda la fecha aunque no haya cambiado;
      // un proyecto viejo ya tiene fechas pasadas y no debe quedar bloqueado.
      if (r.noPasado && !parcial && valor.slice(0, 10) < ayerUTC())
        return `${r.etiqueta} no puede ser anterior a hoy.`;
      return null;
    case 'booleano':
      return typeof valor === 'boolean'
        ? null
        : `${r.etiqueta} debe ser verdadero o falso.`;
    case 'lista-enteros':
      if (
        !Array.isArray(valor) ||
        !valor.every((x) => Number.isInteger(Number(x)))
      )
        return `${r.etiqueta} debe ser una lista de números.`;
      return null;
    case 'lista-textos':
      if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string'))
        return `${r.etiqueta} no es válido.`;
      if (r.max !== undefined && valor.some((x: string) => x.length > r.max!))
        return `${r.etiqueta} no es válido.`;
      return null;
  }
}

export class ValidarCampos implements PipeTransform {
  /** @param parcial PATCH: solo se revisan los campos que vienen en el body. */
  constructor(
    private readonly esquema: EsquemaCampos,
    private readonly parcial = false,
  ) {}

  transform(body: any) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('El cuerpo de la solicitud no es válido.');
    }
    const errors: Record<string, string> = {};
    for (const [campo, regla] of Object.entries(this.esquema)) {
      if (this.parcial && !(campo in body)) continue;
      const error = validarCampo(body[campo], regla, this.parcial);
      if (error) errors[campo] = error;
    }
    if (Object.keys(errors).length) {
      throw new BadRequestException({
        statusCode: 400,
        message: Object.values(errors),
        errors,
      });
    }
    return body;
  }
}
