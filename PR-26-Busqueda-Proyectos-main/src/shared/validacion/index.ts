/* ============================================================================
 * src/shared/validacion/index.ts
 * ÚNICO lugar con las reglas de los campos que ingresa el usuario: límites,
 * formatos (solo letras, correo...) y fechas. Los formularios solo llaman a
 * validarCampos()/validarCampo() con las reglas de CAMPOS; no escriben sus
 * propias validaciones.
 * El backend tiene el espejo en backend/src/common/validacion/: si cambias
 * una regla aquí, cámbiala allá (el backend vuelve a validar todo).
 * ========================================================================= */

export const LIMITES = {
  usuario: {
    nombre_completo: 150,
    cargo: 100,
    correo: 150,
    password_min: 4,
    password_max: 72,
  },
  empresa: {
    nombre: 150,
    portafolio: 250,
    num_empleados_max: 10_000,
    enlace_nombre: 100,
    enlace_url: 500,
  },
  proyecto: {
    nombre: 150,
    descripcion_corta: 500,
    problema: 3000,
    financiamiento_max: 9_999_999_999.99,
  },
  solicitud: {
    mensaje: 1000,
    propuesta: 3000,
  },
  tarea: {
    titulo: 150,
    descripcion: 3000,
    comentario: 1000,
  },
  recurso: {
    nombre: 150,
  },
  chat: {
    mensaje: 2000,
  },
  busqueda: 100,
  codigo_recuperacion: 6,
} as const;

export interface Regla {
  etiqueta: string;
  tipo?: 'texto' | 'email' | 'numero' | 'entero' | 'fecha' | 'url';
  requerido?: boolean;
  /** Texto: longitud mínima/máxima. Número: valor mínimo/máximo. */
  min?: number;
  max?: number;
  patron?: { re: RegExp; mensaje: string };
  /** Fechas: no se permite una fecha anterior a hoy. */
  noPasado?: boolean;
}

// Letras (con acentos y ñ), espacios, apóstrofo, punto y guion. Sin números.
const SOLO_LETRAS = /^[\p{L}\s'.-]+$/u;
// Cargos: letras y la puntuación típica ("Director/a", "I&D", "Jefe (TI)").
const LETRAS_Y_PUNTUACION = /^[\p{L}\s'.,/&()-]+$/u;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_HTTP = /^https?:\/\/\S+\.\S+$/i;

const L = LIMITES;

/** Reglas de cada campo del proyecto. Los formularios las combinan. */
export const CAMPOS = {
  nombre_completo: {
    etiqueta: 'El nombre', requerido: true, min: 2, max: L.usuario.nombre_completo,
    patron: { re: SOLO_LETRAS, mensaje: 'solo puede contener letras' },
  },
  cargo: {
    etiqueta: 'El cargo', max: L.usuario.cargo,
    patron: { re: LETRAS_Y_PUNTUACION, mensaje: 'solo puede contener letras' },
  },
  correo: { etiqueta: 'El correo', tipo: 'email', requerido: true, max: L.usuario.correo },
  password: {
    etiqueta: 'La contraseña', requerido: true,
    min: L.usuario.password_min, max: L.usuario.password_max,
  },

  nombre_empresa: { etiqueta: 'El nombre de la empresa', requerido: true, max: L.empresa.nombre },
  descripcion_empresa: { etiqueta: 'La descripción', requerido: true }, // sin tope (columna text)
  portafolio: { etiqueta: 'El portafolio', requerido: true, max: L.empresa.portafolio },
  num_empleados: {
    etiqueta: 'El número de empleados', tipo: 'entero', requerido: true,
    min: 1, max: L.empresa.num_empleados_max,
  },
  enlace_nombre: { etiqueta: 'El nombre del enlace', max: L.empresa.enlace_nombre },
  enlace_url: { etiqueta: 'La URL', tipo: 'url', requerido: true, max: L.empresa.enlace_url },

  nombre_proyecto: { etiqueta: 'El nombre del proyecto', requerido: true, max: L.proyecto.nombre },
  descripcion_corta: { etiqueta: 'La descripción corta', requerido: true, max: L.proyecto.descripcion_corta },
  descripcion_completa: { etiqueta: 'La descripción completa', requerido: true }, // sin tope (columna text)
  problema: { etiqueta: 'El problema que resuelve', requerido: true, max: L.proyecto.problema },
  fecha_inicio: { etiqueta: 'La fecha de inicio', tipo: 'fecha', requerido: true, noPasado: true },
  fecha_fin: { etiqueta: 'La fecha de finalización', tipo: 'fecha', requerido: true, noPasado: true },
  financiamiento: {
    etiqueta: 'El financiamiento', tipo: 'numero', min: 0, max: L.proyecto.financiamiento_max,
  },

  propuesta: { etiqueta: 'La propuesta de solución', requerido: true, max: L.solicitud.propuesta },
  mensaje_solicitud: { etiqueta: 'El mensaje', max: L.solicitud.mensaje },

  titulo_tarea: { etiqueta: 'El título de la tarea', requerido: true, max: L.tarea.titulo },
  descripcion_tarea: { etiqueta: 'La descripción de la tarea', max: L.tarea.descripcion },
  fecha_limite: { etiqueta: 'La fecha límite', tipo: 'fecha', noPasado: true },
  comentario: { etiqueta: 'El comentario', requerido: true, max: L.tarea.comentario },

  nombre_carpeta: { etiqueta: 'El nombre de la carpeta', requerido: true, max: L.recurso.nombre },
  mensaje_chat: { etiqueta: 'El mensaje', requerido: true, max: L.chat.mensaje },
  codigo: {
    etiqueta: 'El código', requerido: true,
    patron: { re: /^\d{6}$/, mensaje: `debe tener ${L.codigo_recuperacion} dígitos` },
  },
} satisfies Record<string, Regla>;

/** Fecha de hoy en la zona horaria del usuario, formato YYYY-MM-DD (para `min` de los <input type="date">). */
export function hoyISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Devuelve el mensaje de error del campo, o null si es válido. */
export function validarCampo(valor: unknown, r: Regla): string | null {
  const texto = typeof valor === 'string' ? valor.trim() : valor;
  if (texto === undefined || texto === null || texto === '') {
    return r.requerido ? `${r.etiqueta} es obligatorio.` : null;
  }

  switch (r.tipo ?? 'texto') {
    case 'numero':
    case 'entero': {
      const n = Number(texto);
      if (!Number.isFinite(n)) return `${r.etiqueta} debe ser un número.`;
      if (r.tipo === 'entero' && !Number.isInteger(n)) return `${r.etiqueta} debe ser un número entero.`;
      if (r.min !== undefined && n < r.min) return `${r.etiqueta} no puede ser menor que ${r.min}.`;
      if (r.max !== undefined && n > r.max)
        return `${r.etiqueta} no puede ser mayor que ${r.max.toLocaleString('es-MX')}.`;
      return null;
    }
    case 'fecha': {
      const f = String(texto);
      if (!/^\d{4}-\d{2}-\d{2}/.test(f) || Number.isNaN(Date.parse(f))) return `${r.etiqueta} no es válida.`;
      if (r.noPasado && f.slice(0, 10) < hoyISO()) return `${r.etiqueta} no puede ser anterior a hoy.`;
      return null;
    }
    default: {
      const s = String(texto);
      if (r.min !== undefined && s.length < r.min) return `${r.etiqueta} debe tener al menos ${r.min} caracteres.`;
      if (r.max !== undefined && s.length > r.max)
        return `${r.etiqueta} no puede superar ${r.max} caracteres (tiene ${s.length}).`;
      if (r.tipo === 'email' && !EMAIL.test(s)) return `${r.etiqueta} no es válido.`;
      if (r.tipo === 'url' && !URL_HTTP.test(s)) return `${r.etiqueta} debe empezar con http:// o https://.`;
      if (r.patron && !r.patron.re.test(s)) return `${r.etiqueta} ${r.patron.mensaje}.`;
      return null;
    }
  }
}

/**
 * Valida varios campos a la vez. `valores` y `reglas` usan las mismas claves
 * (los `name` del formulario). Devuelve { campo: mensaje } solo con los que fallan.
 */
export function validarCampos(
  valores: object,
  reglas: Record<string, Regla>,
): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const [campo, regla] of Object.entries(reglas)) {
    const error = validarCampo((valores as Record<string, unknown>)[campo], regla);
    if (error) errores[campo] = error;
  }
  return errores;
}

/** Mensaje si la confirmación no coincide con la contraseña. */
export function validarConfirmacion(password: string, confirmacion: string): string | null {
  return password === confirmacion ? null : 'Las contraseñas no coinciden.';
}

/** Mensaje si la fecha de fin es anterior a la de inicio. */
export function validarRangoFechas(inicio?: string | null, fin?: string | null): string | null {
  return inicio && fin && fin < inicio ? 'La fecha de finalización debe ser posterior a la de inicio.' : null;
}

/** Primer mensaje de error, para mostrarlo en un toast. */
export function primerError(errores: Record<string, string>): string | null {
  return Object.values(errores)[0] ?? null;
}

/* ───────────── Contador de caracteres ─────────────
 * Lo usan Input y TextArea cuando reciben `maxLength`: el navegador corta el
 * texto en el límite sin avisar, así que mostramos cuánto llevas. */

/** Texto de ayuda con el conteo. En campos cortos (Input) solo aparece al
 * acercarse al límite (80 %) para no llenar la pantalla de contadores. */
export function textoContador(valor: unknown, max: number | undefined, siempre: boolean): string | undefined {
  if (!max || typeof valor !== 'string') return undefined;
  const n = valor.length;
  if (n >= max) return `Llegaste al máximo de ${max} caracteres.`;
  if (siempre || n >= max * 0.8) return `${n} / ${max} caracteres`;
  return undefined;
}

/** Si lo pegado no cabe, avisa con un toast de que se va a recortar. */
export function avisarSiSeRecorta(
  e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  max: number | undefined,
  avisar: (mensaje: string) => void,
) {
  if (!max) return;
  const campo = e.currentTarget;
  const pegado = e.clipboardData.getData('text').length;
  const seleccion = (campo.selectionEnd ?? 0) - (campo.selectionStart ?? 0);
  if (campo.value.length - seleccion + pegado > max) {
    avisar(`El texto se recortó a ${max} caracteres (es el máximo de este campo).`);
  }
}
