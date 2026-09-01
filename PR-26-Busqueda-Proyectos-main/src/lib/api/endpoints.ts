/* ============================================================================
 * src/lib/api/endpoints.ts
 * TODAS las rutas del backend en un solo lugar (Anexo B4/B5). Sin el prefijo
 * /api (lo añade el cliente). Si el backend cambia una ruta, este es el ÚNICO
 * archivo que se toca.
 * ========================================================================= */

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    PERFIL: '/auth/profile',
    OLVIDE_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CAMBIAR_PASSWORD: '/auth/change-password',
    REGISTRO_EMPRESA: '/auth/register/empresa',
    REGISTRO_EMPLEADO: '/auth/register/empleado',
    REGISTRO_INDEPENDIENTE: '/auth/register/independiente',
  },

  EMPRESAS: {
    LISTAR: '/empresas',
    DETALLE: (id: number | string) => `/empresas/${id}`,
    ACTUALIZAR: (id: number | string) => `/empresas/${id}`,
    ELIMINAR: (id: number | string) => `/empresas/${id}`,
    APROBAR: (id: number | string) => `/empresas/${id}/aprobar`,
    BLOQUEAR: (id: number | string) => `/empresas/${id}/bloquear`,
    DESBLOQUEAR: (id: number | string) => `/empresas/${id}/desbloquear`,
  },

  PROYECTOS: {
    LISTAR: '/proyectos',
    CREAR: '/proyectos',
    ARCHIVADOS: '/proyectos/archivados',
    AUTO_TERMINAR: '/proyectos/admin/auto-terminar',
    DETALLE: (id: number | string) => `/proyectos/${id}`,
    ACTUALIZAR: (id: number | string) => `/proyectos/${id}`,
    ESTADO: (id: number | string) => `/proyectos/${id}/estado`,
    TRANSFERIR: (id: number | string) => `/proyectos/${id}/transferir`,
    PARTICIPANTE: (id: number | string, usuarioId: number | string) =>
      `/proyectos/${id}/participantes/${usuarioId}`,
    SOLICITUDES_ENVIADAS: '/proyectos/usuario/solicitudes-enviadas',
    SOLICITUDES_PENDIENTES: '/proyectos/usuario/solicitudes-pendientes',
    SOLICITUDES_POR_PROYECTO: (id: number | string) => `/proyectos/${id}/solicitudes`,
    CREAR_SOLICITUD: (id: number | string) => `/proyectos/${id}/solicitudes`,
    ACEPTAR_SOLICITUD: (solicitudId: number | string) =>
      `/proyectos/solicitudes/${solicitudId}/aceptar`,
    RECHAZAR_SOLICITUD: (solicitudId: number | string) =>
      `/proyectos/solicitudes/${solicitudId}/rechazar`,
  },

  USUARIOS: {
    LISTAR: '/usuarios',
    ME: '/usuarios/me',
    CREAR_RAPIDO: '/usuarios/quick-create',
    DETALLE: (id: number | string) => `/usuarios/${id}`,
    ELIMINAR: (id: number | string) => `/usuarios/${id}`,
    PROMOVER: (id: number | string) => `/usuarios/${id}/promover`,
    DEGRADAR: (id: number | string) => `/usuarios/${id}/degradar`,
    BLOQUEAR: (id: number | string) => `/usuarios/${id}/bloquear`,
    DESBLOQUEAR: (id: number | string) => `/usuarios/${id}/desbloquear`,
    SOLICITUDES_EMPRESA: (empresaId: number | string) =>
      `/usuarios/solicitudes/empresa/${empresaId}`,
    APROBAR_SOLICITUD: (id: number | string) => `/usuarios/solicitudes/${id}/aprobar`,
    RECHAZAR_SOLICITUD: (id: number | string) => `/usuarios/solicitudes/${id}/rechazar`,
    ELIMINAR_SOLICITUD: (id: number | string) => `/usuarios/solicitudes/${id}`,
  },

  TAREAS: {
    CREAR: '/tareas',
    ACTUALIZAR: (id: number | string) => `/tareas/${id}`,
    ELIMINAR: (id: number | string) => `/tareas/${id}`,
    COMENTARIOS: (id: number | string) => `/tareas/${id}/comentarios`,
    POR_PROYECTO: (proyectoId: number | string) => `/tareas/proyecto/${proyectoId}`,
    DETALLE: (id: number | string) => `/tareas/${id}`,
    COLUMNAS: '/tareas/columnas',
    COLUMNAS_POR_PROYECTO: (proyectoId: number | string) =>
      `/tareas/columnas/proyecto/${proyectoId}`,
  },

  RECURSOS: {
    LISTAR: '/recursos',
    CREAR: '/recursos',
    ELIMINAR: (id: number | string) => `/recursos/${id}`,
    UPLOAD: '/recursos/upload',
  },

  CHATS: {
    MENSAJES_POR_PROYECTO: (proyectoId: number | string) =>
      `/chats/proyecto/${proyectoId}/mensajes`,
  },
} as const;
