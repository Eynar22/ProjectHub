/* ============================================================================
 * src/features/workspace/services/chat.service.ts
 * Chat de un proyecto (ChatController).
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { Message } from '../types/workspace.types';

export const chatService = {
  /** Mensajes del chat de un proyecto, en orden cronológico. */
  async listarMensajes(proyectoId: number | string): Promise<Message[]> {
    return apiClient.get<Message[]>(ENDPOINTS.CHATS.MENSAJES_POR_PROYECTO(proyectoId));
  },

  /** Envía un mensaje al chat de un proyecto. */
  async enviarMensaje(
    proyectoId: number | string,
    contenido: string,
    archivoUrl?: string,
  ): Promise<Message> {
    return apiClient.post<Message>(ENDPOINTS.CHATS.MENSAJES_POR_PROYECTO(proyectoId), {
      contenido,
      archivo_url: archivoUrl,
    });
  },
};
