/* ============================================================================
 * src/lib/api/client.ts
 * Cliente HTTP único del proyecto (Anexo B4/B5). Aquí vive TODO lo transversal:
 * URL base, token de sesión, timeout, manejo global del 401 y normalización
 * de errores a ApiError. Ningún otro archivo hace fetch() directamente.
 * ========================================================================= */

import { config } from '@/lib/config';
import { storage } from '@/lib/storage';
import { normalizarError, type ApiErrorClass } from './errors';

/** Si el backend no responde en 15s, se aborta la petición. */
const TIMEOUT_MS = 15_000;

type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface OpcionesPeticion {
  method?: Metodo;
  /** Objeto (se serializa a JSON) o FormData (se envía tal cual). */
  body?: unknown;
  headers?: Record<string, string>;
  /** Parámetros de query. Los valores undefined/null se omiten. */
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

function construirUrl(endpoint: string, params?: OpcionesPeticion['params']): string {
  const url = `${config.apiUrl}${endpoint}`;
  if (!params) return url;
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null) query.append(clave, String(valor));
  }
  const qs = query.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Petición base. Devuelve el body ya parseado y tipado; lanza ApiError en
 * cualquier fallo. Maneja el 401 global cerrando sesión.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: OpcionesPeticion = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, params, signal } = options;
  const esFormData = body instanceof FormData;

  // --- token de sesión: se adjunta a cada llamada saliente ---
  const token = storage.obtenerToken();
  const cabeceras: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
    ...headers,
  };

  // --- timeout mediante AbortController ---
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort());

  let response: Response;
  try {
    response = await fetch(construirUrl(endpoint, params), {
      method,
      headers: cabeceras,
      signal: controller.signal,
      body: esFormData ? (body as FormData) : body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    clearTimeout(timeout);
    // Fallo de red o abort (timeout): status 0.
    throw normalizarError(0, null);
  }
  clearTimeout(timeout);

  // --- cuerpo de la respuesta (puede no ser JSON en errores de proxy) ---
  let data: unknown = null;
  const texto = await response.text();
  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // 401 a mitad de sesión: token caducado -> cerrar y volver al login.
    // No aplica a los endpoints de autenticación (login / perfil de arranque).
    if (response.status === 401 && token && !endpoint.startsWith('/auth/')) {
      storage.limpiarSesion();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    throw normalizarError(response.status, data as Record<string, unknown> | null);
  }

  return data as T;
}

/** Fachada por verbo. El servicio escribe `apiClient.get<Evento[]>(...)`. */
export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<OpcionesPeticion, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: Omit<OpcionesPeticion, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
  patch: <T>(endpoint: string, body?: unknown, options?: Omit<OpcionesPeticion, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options?: Omit<OpcionesPeticion, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Alias histórico. El código existente importa `{ api }` desde services/api.
 * Se mantiene mientras se migran las páginas a servicios por recurso.
 * @deprecated usar `apiClient` desde '@/lib/api/client'.
 */
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'POST', body }),
  patch: <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export type { ApiErrorClass };
