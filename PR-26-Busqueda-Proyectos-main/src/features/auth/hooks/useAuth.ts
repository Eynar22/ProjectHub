/* ============================================================================
 * src/features/auth/hooks/useAuth.ts
 *
 * Conecta el servicio de auth con React. Cada hook expone `mutate`/`mutateAsync`,
 * `isPending` y `error` ya listos; el componente solo dispara y muestra estado.
 * El estado de SESIÓN (usuario actual) sigue en AppContext hasta que se migre.
 * ========================================================================= */

import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type {
  RegistrarEmpresaInput,
  RegistrarEmpleadoInput,
  RestablecerPasswordInput,
  CambiarPasswordInput,
} from '../types/auth.types';

/** Registro de empresa nueva + su administrador. */
export function useRegistrarEmpresa() {
  return useMutation({
    mutationFn: (datos: RegistrarEmpresaInput) => authService.registrarEmpresa(datos),
  });
}

/** Registro de empleado que se une a una empresa existente. */
export function useRegistrarEmpleado() {
  return useMutation({
    mutationFn: (datos: RegistrarEmpleadoInput) => authService.registrarEmpleado(datos),
  });
}

/** Solicita el código de recuperación de contraseña. */
export function useSolicitarCodigoRecuperacion() {
  return useMutation({
    mutationFn: (correo: string) => authService.solicitarCodigoRecuperacion(correo),
  });
}

/** Restablece la contraseña con el código recibido por correo. */
export function useRestablecerPassword() {
  return useMutation({
    mutationFn: (datos: RestablecerPasswordInput) => authService.restablecerPassword(datos),
  });
}

/** Cambia la contraseña temporal por una definitiva. */
export function useCambiarPassword() {
  return useMutation({
    mutationFn: (datos: CambiarPasswordInput) => authService.cambiarPassword(datos),
  });
}
