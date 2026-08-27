/* ============================================================================
 * src/lib/queryClient.ts
 * Configuración única de TanStack Query (Anexo B9). El estado del servidor
 * (carga, error, caché, reintentos) vive aquí, no en useState/useEffect.
 * ========================================================================= */

import { QueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 1 min: evita refetch en cada render/montaje.
      staleTime: 60_000,
      // No reintentar errores del cliente (4xx); sí un fallo puntual de red.
      retry: (fallos, error) => {
        const status = (error as unknown as Partial<ApiError>)?.status;
        if (status && status >= 400 && status < 500) return false;
        return fallos < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
