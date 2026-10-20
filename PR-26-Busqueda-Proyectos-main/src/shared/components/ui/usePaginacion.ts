/* ============================================================================
 * src/shared/components/ui/usePaginacion.ts
 * Paginación de listados en el cliente (ver Paginacion.tsx para el uso).
 * `reinicio`: cuando cambia alguno de esos valores (búsqueda, filtros, pestaña)
 * se vuelve a la página 1. Si la lista se achica, la página se ajusta sola.
 * ========================================================================= */

import { useRef, useState } from 'react';

export function usePaginacion<T>(items: T[], porPagina = 10, reinicio: unknown[] = []) {
  const clave = JSON.stringify(reinicio);
  const [estado, setEstado] = useState({ clave, pagina: 1 });
  const refLista = useRef<HTMLDivElement>(null);

  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina));
  // Derivado (sin efectos): otra clave → página 1; lista más corta → última página.
  const pagina = Math.min(estado.clave === clave ? estado.pagina : 1, totalPaginas);
  const visibles = items.slice((pagina - 1) * porPagina, pagina * porPagina);

  const irA = (n: number) => {
    setEstado({ clave, pagina: Math.min(Math.max(1, n), totalPaginas) });
    // Si el inicio de la lista quedó arriba de la pantalla, se vuelve a él.
    const el = refLista.current;
    if (el && el.getBoundingClientRect().top < 0) {
      const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return {
    visibles,
    pagina,
    totalPaginas,
    refLista,
    irA,
    props: { pagina, totalPaginas, total: items.length, porPagina, onCambiar: irA },
  };
}
