/* ============================================================================
 * COMPAT — el cliente HTTP vive ahora en '@/lib/api/client' (Anexo B).
 * Este archivo solo re-exporta para no romper imports existentes mientras se
 * migran las páginas a servicios por recurso. No añadir lógica aquí.
 * ========================================================================= */
export { api, apiClient, apiRequest } from '@/lib/api/client';
export { normalizarError, ApiErrorClass, type ApiError } from '@/lib/api/errors';
