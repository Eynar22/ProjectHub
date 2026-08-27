/* ============================================================================
 * src/app/TitleSync.tsx
 * Fija un título de pestaña único y descriptivo por ruta (WCAG 2.4.2 /
 * Manual 11.2). Lo toma del `handle.titulo` de la ruta más profunda que lo
 * declare y renderiza el <Outlet> de la app.
 * ========================================================================= */

import { useEffect } from 'react';
import { Outlet, useMatches } from 'react-router';

const BASE_TITLE = 'ProjectHub';

export function TitleSync() {
  const matches = useMatches();
  useEffect(() => {
    const conTitulo = [...matches].reverse().find(
      (m) => (m.handle as { titulo?: string } | undefined)?.titulo,
    );
    const titulo = (conTitulo?.handle as { titulo?: string } | undefined)?.titulo;
    document.title = titulo ? `${titulo} · ${BASE_TITLE}` : BASE_TITLE;
  }, [matches]);
  return <Outlet />;
}
