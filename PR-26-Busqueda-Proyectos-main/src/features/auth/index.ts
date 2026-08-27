/* Punto de entrada público de la feature auth.
 * Solo se exporta lo que otras capas pueden usar. */
export { authService } from './services/auth.service';
export {
  useRegistrarEmpresa,
  useRegistrarEmpleado,
  useSolicitarCodigoRecuperacion,
  useRestablecerPassword,
  useCambiarPassword,
} from './hooks/useAuth';
export type {
  LoginDto,
  LoginResponse,
  LoginResultado,
  RegistroEmpresaDto,
  RegistroEmpleadoDto,
  RegistrarEmpresaInput,
  RegistrarEmpleadoInput,
  RestablecerPasswordInput,
  CambiarPasswordInput,
} from './types/auth.types';
