/* ============================================================================
 * src/lib/storage.ts
 * Wrapper de localStorage (Anexo B). Un solo lugar sabe cómo se guarda el
 * token de sesión y el tema; el resto del código llama a estos métodos.
 * ========================================================================= */

const TOKEN_KEY = 'token';

export const storage = {
  obtenerToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  guardarToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* modo incógnito o almacenamiento deshabilitado */
    }
  },

  limpiarSesion(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  },
};
