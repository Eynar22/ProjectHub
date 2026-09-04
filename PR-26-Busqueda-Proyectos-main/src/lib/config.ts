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
  // Sin variable definida: ruta relativa `/api`. En producción la resuelve
  // nginx; en dev, el proxy de Vite (ver vite.config.mts). Que sea relativa
  // permite usar `/api/archivos/...` directamente en <img src>.
  return '/api';
}

export const config = {
  apiUrl: resolverApiUrl(),
  appNombre: import.meta.env.VITE_APP_NOMBRE ?? 'ProjectHub',
  debug: import.meta.env.VITE_DEBUG === 'true',
} as const;
