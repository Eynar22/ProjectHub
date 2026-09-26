import { INT_MAX, LIMITES as L } from './limites';
import { EsquemaCampos, ReglaCampo } from './validar-campos.pipe';

/* ÚNICO lugar con las reglas de los campos. Espejo de src/shared/validacion
 * en el frontend: si cambias una regla aquí, cámbiala allá. */

// Letras (con acentos y ñ), espacios, apóstrofo, punto y guion. Sin números.
const SOLO_LETRAS = /^[\p{L}\s'.-]+$/u;
// Cargos: letras y la puntuación típica ("Director/a", "I&D", "Jefe (TI)").
const LETRAS_Y_PUNTUACION = /^[\p{L}\s'.,/&()-]+$/u;

/** Reglas de cada campo; los esquemas de abajo las combinan. */
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
  url: { etiqueta: 'El archivo', max: L.url },

  nombre_empresa: { etiqueta: 'El nombre de la empresa', requerido: true, max: L.empresa.nombre },
  descripcion_empresa: { etiqueta: 'La descripción', max: L.empresa.descripcion },
  portafolio: { etiqueta: 'El portafolio', max: L.empresa.portafolio },
  num_empleados: {
    etiqueta: 'El número de empleados', tipo: 'entero', min: 1, max: L.empresa.num_empleados_max,
  },

  nombre_proyecto: { etiqueta: 'El nombre del proyecto', requerido: true, max: L.proyecto.nombre },
  descripcion_corta: { etiqueta: 'La descripción corta', max: L.proyecto.descripcion_corta },
  descripcion_completa: { etiqueta: 'La descripción completa', max: L.proyecto.descripcion_completa },
  problema: { etiqueta: 'El problema que resuelve', max: L.proyecto.problema },
  fecha_inicio: { etiqueta: 'La fecha de inicio', tipo: 'fecha', noPasado: true },
  fecha_fin: { etiqueta: 'La fecha de finalización', tipo: 'fecha', noPasado: true },
  financiamiento: {
    etiqueta: 'El financiamiento', tipo: 'numero', min: 0, max: L.proyecto.financiamiento_max,
  },

  titulo_tarea: { etiqueta: 'El título de la tarea', requerido: true, max: L.tarea.titulo },
  descripcion_tarea: { etiqueta: 'La descripción de la tarea', max: L.tarea.descripcion },
  fecha_limite: { etiqueta: 'La fecha límite', tipo: 'fecha', noPasado: true },
  orden: { etiqueta: 'El orden', tipo: 'entero', min: 0, max: INT_MAX },
  codigo: {
    etiqueta: 'El código', requerido: true,
    patron: { re: /^\d{6}$/, mensaje: `debe tener ${L.codigo_recuperacion} dígitos` },
  },
} satisfies Record<string, ReglaCampo>;

const C = CAMPOS;
const obligatorio = (r: ReglaCampo): ReglaCampo => ({ ...r, requerido: true });

// ───────────── Auth ─────────────
export const ESQUEMA_LOGIN: EsquemaCampos = {
  correo: C.correo,
  password: { etiqueta: 'La contraseña', requerido: true },
};

export const ESQUEMA_REGISTRO_EMPRESA: EsquemaCampos = {
  nombre_empresa: C.nombre_empresa,
  descripcion: obligatorio(C.descripcion_empresa),
  num_empleados: C.num_empleados,
  portafolio: obligatorio(C.portafolio),
  documento_empresa_url: { ...C.url, etiqueta: 'El documento de la empresa', requerido: true },
  logo_url: { ...C.url, etiqueta: 'El logo' },
  imagenes_urls: { etiqueta: 'Las imágenes', tipo: 'lista-textos', max: L.url },
  nombre_completo: C.nombre_completo,
  cargo: obligatorio(C.cargo),
  correo: C.correo,
  password: C.password,
  documento_personal_url: { ...C.url, etiqueta: 'El documento personal', requerido: true },
};

export const ESQUEMA_REGISTRO_EMPLEADO: EsquemaCampos = {
  nombre_completo: C.nombre_completo,
  cargo: obligatorio(C.cargo),
  correo: C.correo,
  password: C.password,
  documento_url: { ...C.url, etiqueta: 'El documento de pertenencia', requerido: true },
  empresa_id: { etiqueta: 'La empresa', tipo: 'entero', requerido: true, min: 1 },
};

export const ESQUEMA_REGISTRO_INDEPENDIENTE: EsquemaCampos = {
  nombre_completo: C.nombre_completo,
  cargo: { ...C.cargo, etiqueta: 'El rol o profesión' },
  correo: C.correo,
  password: C.password,
  documento_url: { ...C.url, etiqueta: 'El CV' },
};

export const ESQUEMA_CORREO: EsquemaCampos = { correo: C.correo };

export const ESQUEMA_VERIFICAR_CODIGO: EsquemaCampos = { correo: C.correo, codigo: C.codigo };

export const ESQUEMA_RESET_PASSWORD: EsquemaCampos = {
  correo: C.correo,
  codigo: C.codigo,
  nueva_password: { ...C.password, etiqueta: 'La nueva contraseña' },
};

export const ESQUEMA_CAMBIAR_PASSWORD: EsquemaCampos = {
  password_actual: { etiqueta: 'La contraseña actual', requerido: true },
  password_nueva: { ...C.password, etiqueta: 'La nueva contraseña' },
};

// ───────────── Usuarios / empresa ─────────────
export const ESQUEMA_USUARIO: EsquemaCampos = {
  nombre_completo: C.nombre_completo,
  cargo: C.cargo,
  correo: C.correo,
  password: C.password,
  foto_url: { ...C.url, etiqueta: 'La foto' },
  onboarding_completado: { etiqueta: 'Onboarding completado', tipo: 'booleano' },
};

export const ESQUEMA_ALTA_RAPIDA: EsquemaCampos = {
  nombre_completo: C.nombre_completo,
  correo: C.correo,
  cargo: C.cargo,
  proyecto_id: { etiqueta: 'El proyecto', tipo: 'entero', min: 1 },
};

export const ESQUEMA_EMPRESA: EsquemaCampos = {
  nombre: C.nombre_empresa,
  descripcion: C.descripcion_empresa,
  portafolio: C.portafolio,
  num_empleados: C.num_empleados,
  logo_url: { ...C.url, etiqueta: 'El logo' },
  documento_url: { ...C.url, etiqueta: 'El documento' },
};

// ───────────── Proyectos ─────────────
export const ESQUEMA_PROYECTO: EsquemaCampos = {
  nombre: C.nombre_proyecto,
  descripcion_corta: C.descripcion_corta,
  descripcion_completa: C.descripcion_completa,
  problema: C.problema,
  categoria: { etiqueta: 'La categoría', max: L.proyecto.categoria },
  fecha_inicio: C.fecha_inicio,
  fecha_fin: C.fecha_fin,
  financiamiento: C.financiamiento,
  ods: { etiqueta: 'Los ODS', tipo: 'lista-enteros' },
  documento_url: { ...C.url, etiqueta: 'El documento' },
};

export const ESQUEMA_SOLICITUD_PROYECTO: EsquemaCampos = {
  mensaje: { etiqueta: 'El mensaje', max: L.solicitud.mensaje },
  propuesta: { etiqueta: 'La propuesta de solución', max: L.solicitud.propuesta },
  propuesta_url: { ...C.url, etiqueta: 'El documento de la propuesta' },
  cv_url: { ...C.url, etiqueta: 'El CV' },
};

// ───────────── Workspace ─────────────
export const ESQUEMA_TAREA: EsquemaCampos = {
  titulo: C.titulo_tarea,
  descripcion: C.descripcion_tarea,
  prioridad: { etiqueta: 'La prioridad', valores: ['baja', 'media', 'alta'] },
  fecha_limite: C.fecha_limite,
  orden: C.orden,
  usuario_ids: { etiqueta: 'Los asignados', tipo: 'lista-enteros' },
};

export const ESQUEMA_COLUMNA: EsquemaCampos = {
  nombre: { etiqueta: 'El nombre de la columna', requerido: true, max: L.tarea.columna },
  orden: C.orden,
};

export const ESQUEMA_COMENTARIO: EsquemaCampos = {
  texto: { etiqueta: 'El comentario', requerido: true, max: L.tarea.comentario },
};

export const ESQUEMA_RECURSO: EsquemaCampos = {
  nombre: { etiqueta: 'El nombre', requerido: true, max: L.recurso.nombre },
  tipo: { etiqueta: 'El tipo', valores: ['archivo', 'carpeta'] },
  url: { ...C.url, etiqueta: 'La URL' },
};

export const ESQUEMA_MENSAJE: EsquemaCampos = {
  contenido: { etiqueta: 'El mensaje', max: L.chat.mensaje },
  archivo_url: C.url,
};
