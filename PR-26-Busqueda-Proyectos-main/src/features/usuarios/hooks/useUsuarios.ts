/* ============================================================================
 * src/features/usuarios/hooks/useUsuarios.ts
 * Conecta el servicio de usuarios con React (Anexo B9).
 * ========================================================================= */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usuariosService } from '../services/usuarios.service';
import type { ActualizarPerfilDto, AccionUsuario } from '../types/usuarios.types';

export const USUARIOS_KEYS = {
  todos: ['usuarios'] as const,
  lista: () => [...USUARIOS_KEYS.todos, 'lista'] as const,
  detalle: (id: number | string) => [...USUARIOS_KEYS.todos, 'detalle', String(id)] as const,
};

const REFETCH_MS = 30_000;

/** Lista de usuarios. Solo se pide si `habilitado` (hay sesión). */
export function useUsuarios(habilitado = true) {
  return useQuery({
    queryKey: USUARIOS_KEYS.lista(),
    queryFn: () => usuariosService.listar(),
    enabled: habilitado,
    refetchInterval: () => (document.hidden ? false : REFETCH_MS),
  });
}

/** Un usuario por id, con sus campos completos. */
export function useUsuario(id: number | string | undefined) {
  return useQuery({
    queryKey: USUARIOS_KEYS.detalle(id ?? ''),
    queryFn: () => usuariosService.obtenerPorId(id!),
    enabled: id != null && id !== '',
  });
}

const MENSAJE_ACCION: Record<AccionUsuario, string> = {
  promover: 'Usuario promovido a administrador',
  degradar: 'Se quitó el rol de administrador',
  bloquear: 'Usuario bloqueado',
  desbloquear: 'Usuario desbloqueado',
  eliminar: 'Usuario eliminado',
};

/** Modera un usuario e invalida la lista. */
export function useModerarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accion }: { id: number; accion: AccionUsuario }) =>
      usuariosService.moderar(id, accion),
    onSuccess: (_data, { accion }) => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.todos });
      toast.success(MENSAJE_ACCION[accion]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la acción');
    },
  });
}

/** Actualiza el perfil propio. Devuelve el usuario actualizado. */
export function useActualizarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: ActualizarPerfilDto) => usuariosService.actualizarPerfil(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.todos });
    },
  });
}
