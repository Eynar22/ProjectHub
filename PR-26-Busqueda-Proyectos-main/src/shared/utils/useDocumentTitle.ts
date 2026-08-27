import { useEffect } from 'react';

const BASE_TITLE = 'ProjectHub';

/**
 * Sobrescribe el título de pestaña con un valor dinámico (p. ej. el nombre de
 * un proyecto ya cargado). Complementa al `handle.titulo` estático de las rutas
 * (ver app/TitleSync). Pasa `undefined` mientras no haya dato y no toca el título.
 */
export function useDocumentTitle(titulo: string | undefined) {
  useEffect(() => {
    if (!titulo) return;
    document.title = `${titulo} · ${BASE_TITLE}`;
  }, [titulo]);
}
