/* ============================================================================
 * src/features/auth/services/auth.service.ts
 *
 * Responsabilidad: hablar con los endpoints de autenticación del backend.
 * NO maneja estado de sesión. NO muestra toasts. NO conoce React.
 * Sube los File al backend (disco) y arma la forma que espera cada endpoint.
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { User } from '@/shared/types/user.types';
import type {
  LoginDto,
  LoginResponse,
  RegistrarEmpresaInput,
  RegistrarEmpleadoInput,
  RegistrarIndependienteInput,
  RestablecerPasswordInput,
  CambiarPasswordInput,
} from '../types/auth.types';

/**
 * Sube un archivo por el endpoint de registro (sin sesión, rate-limited) y
 * devuelve la ruta `/api/archivos/...` que espera el backend en la columna *_url.
 */
async function subir(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { url } = await apiClient.post<{ url: string }>(ENDPOINTS.ARCHIVOS.REGISTRO, formData);
  return url;
}

export const authService = {
  /** Autentica al usuario. Devuelve el token y el usuario. */
  async login(dto: LoginDto): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, dto);
  },

  /** Usuario autenticado actual (persistencia de sesión, tras cambiar datos). */
  async obtenerPerfil(): Promise<User> {
    return apiClient.get<User>(ENDPOINTS.AUTH.PERFIL);
  },

  /** Registra una empresa nueva y su primer administrador. */
  async registrarEmpresa(datos: RegistrarEmpresaInput): Promise<void> {
    const [documento_empresa_url, documento_personal_url, logo_url, imagenes_urls] = await Promise.all([
      subir(datos.responsable.documentoEmpresa),
      subir(datos.responsable.documentoPersonal),
      datos.empresa.logo ? subir(datos.empresa.logo) : Promise.resolve(undefined),
      Promise.all((datos.empresa.fotos ?? []).map((f) => subir(f))),
    ]);

    await apiClient.post(ENDPOINTS.AUTH.REGISTRO_EMPRESA, {
      correo: datos.correo,
      password: datos.password,
      nombre_empresa: datos.empresa.nombre,
      descripcion: datos.empresa.descripcion,
      num_empleados: datos.empresa.num_empleados,
      portafolio: datos.empresa.portafolio,
      documento_empresa_url,
      logo_url,
      imagenes_urls,
      nombre_completo: datos.responsable.nombre_completo,
      cargo: datos.responsable.cargo,
      documento_personal_url,
    });
  },

  /** Registra un empleado que se une a una empresa existente. */
  async registrarEmpleado(datos: RegistrarEmpleadoInput): Promise<void> {
    const documento_url = await subir(datos.documento);

    await apiClient.post(ENDPOINTS.AUTH.REGISTRO_EMPLEADO, {
      nombre_completo: datos.nombre_completo,
      correo: datos.correo,
      password: datos.password,
      cargo: datos.cargo,
      documento_url,
      empresa_id: datos.empresa_id,
    });
  },

  /** Registra un usuario independiente (sin empresa). Acceso inmediato. */
  async registrarIndependiente(datos: RegistrarIndependienteInput): Promise<void> {
    const documento_url = datos.cv ? await subir(datos.cv) : undefined;

    await apiClient.post(ENDPOINTS.AUTH.REGISTRO_INDEPENDIENTE, {
      nombre_completo: datos.nombre_completo,
      correo: datos.correo,
      password: datos.password,
      cargo: datos.cargo,
      documento_url,
    });
  },

  /** Solicita el envío del código de recuperación al correo dado. */
  async solicitarCodigoRecuperacion(correo: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.OLVIDE_PASSWORD, { correo });
  },

  /** Restablece la contraseña con el código recibido por correo. */
  async restablecerPassword(datos: RestablecerPasswordInput): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, datos);
  },

  /** Cambia la contraseña temporal por una definitiva (usuario ya logueado). */
  async cambiarPassword(datos: CambiarPasswordInput): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH.CAMBIAR_PASSWORD, datos);
  },
};
