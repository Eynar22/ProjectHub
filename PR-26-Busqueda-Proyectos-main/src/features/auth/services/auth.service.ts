/* ============================================================================
 * src/features/auth/services/auth.service.ts
 *
 * Responsabilidad: hablar con los endpoints de autenticación del backend.
 * NO maneja estado de sesión. NO muestra toasts. NO conoce React.
 * Convierte los File a base64 y arma la forma que espera cada endpoint.
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { fileToBase64 } from '@/shared/utils/fileToBase64';
import type { User } from '@/shared/types/user.types';
import type {
  LoginDto,
  LoginResponse,
  RegistrarEmpresaInput,
  RegistrarEmpleadoInput,
  RestablecerPasswordInput,
  CambiarPasswordInput,
} from '../types/auth.types';

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
    const [documento_empresa_url, documento_personal_url] = await Promise.all([
      fileToBase64(datos.responsable.documentoEmpresa),
      fileToBase64(datos.responsable.documentoPersonal),
    ]);

    await apiClient.post(ENDPOINTS.AUTH.REGISTRO_EMPRESA, {
      correo: datos.correo,
      password: datos.password,
      nombre_empresa: datos.empresa.nombre,
      descripcion: datos.empresa.descripcion,
      num_empleados: datos.empresa.num_empleados,
      portafolio: datos.empresa.portafolio,
      documento_empresa_url,
      nombre_completo: datos.responsable.nombre_completo,
      cargo: datos.responsable.cargo,
      documento_personal_url,
    });
  },

  /** Registra un empleado que se une a una empresa existente. */
  async registrarEmpleado(datos: RegistrarEmpleadoInput): Promise<void> {
    const documento_url = await fileToBase64(datos.documento);

    await apiClient.post(ENDPOINTS.AUTH.REGISTRO_EMPLEADO, {
      nombre_completo: datos.nombre_completo,
      correo: datos.correo,
      password: datos.password,
      cargo: datos.cargo,
      documento_url,
      empresa_id: datos.empresa_id,
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
