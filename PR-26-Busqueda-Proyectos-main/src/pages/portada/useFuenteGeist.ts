/* ============================================================================
 * src/pages/portada/useFuenteGeist.ts
 * Carga la fuente Geist (de la portada y sus páginas públicas) mientras la
 * página está abierta. Si ya está cargada, no la duplica.
 * ========================================================================= */

import { useEffect } from 'react';

const FUENTE = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap';

export function useFuenteGeist() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FUENTE}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FUENTE;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);
}
