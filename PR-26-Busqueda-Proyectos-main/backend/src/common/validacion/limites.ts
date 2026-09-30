/* Límites de los campos que ingresa el usuario. Salen de las columnas de las
 * entidades (varchar(n), numeric(12,2), int...) y de reglas de negocio para los
 * campos `text`, que en BD no tienen tope. El frontend tiene una copia en
 * src/shared/constants/limites.ts: si cambias uno, cambia el otro. */
export const LIMITES = {
  usuario: {
    nombre_completo: 150,
    cargo: 100,
    correo: 150,
    password_min: 4,
    password_max: 72, // bcrypt ignora lo que pasa de 72 bytes
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
    categoria: 100,
    financiamiento_max: 9_999_999_999.99, // numeric(12,2)
  },
  solicitud: {
    mensaje: 1000,
    propuesta: 3000,
  },
  tarea: {
    titulo: 150,
    descripcion: 3000,
    comentario: 1000,
    columna: 50,
  },
  recurso: {
    nombre: 150,
  },
  chat: {
    mensaje: 2000,
  },
  url: 1000,
  codigo_recuperacion: 6,
} as const;

/** Mayor valor que cabe en una columna `int` de Postgres. */
export const INT_MAX = 2_147_483_647;
