/* ============================================================================
 * src/lib/config.ts
 * Lectura centralizada de variables de entorno (Anexo B10).
 * Ningún otro archivo debe usar import.meta.env directamente.
 * ========================================================================= */

/** URL base del backend con el prefijo /api ya incluido, sin barra final. */
function resolverApiUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return `${fromEnv.replace(/\/+$/, '')}/api`;
  }
  // Sin variable definida: comportamiento histórico del proyecto.
  const esLocal =
    typeof window !== 'undefined' && window.location.hostname === 'localhost';
  return esLocal ? 'http://localhost:3000/api' : '/api';
}

export const config = {
  apiUrl: resolverApiUrl(),
  appNombre: import.meta.env.VITE_APP_NOMBRE ?? 'ProjectHub',
  debug: import.meta.env.VITE_DEBUG === 'true',
} as const;
