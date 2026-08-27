/* ============================================================================
 * src/features/workspace/hooks/useChat.ts
 * Chat de un proyecto (Anexo B9). El polling manual se sustituye por
 * refetchInterval.
 * ========================================================================= */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';

export const CHAT_KEYS = {
  todos: ['chat'] as const,
  proyecto: (proyectoId: number | string) =>
    [...CHAT_KEYS.todos, String(proyectoId)] as const,
};

/** Mensajes del chat; se re-descargan cada 3 s mientras la pestaña esté visible. */
export function useMensajesChat(proyectoId: number | string | undefined) {
  return useQuery({
    queryKey: CHAT_KEYS.proyecto(proyectoId ?? ''),
    queryFn: () => chatService.listarMensajes(proyectoId!),
    enabled: proyectoId != null && proyectoId !== '',
    refetchInterval: () => (document.hidden ? false : 3_000),
  });
}

export function useEnviarMensaje(proyectoId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contenido, archivoUrl }: { contenido: string; archivoUrl?: string }) =>
      chatService.enviarMensaje(proyectoId, contenido, archivoUrl),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.proyecto(proyectoId) }),
  });
}
