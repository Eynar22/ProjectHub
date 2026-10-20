/* ============================================================================
 * src/shared/components/ui/Paginacion.tsx
 * Paginación de listados en el cliente: el hook `usePaginacion` (usePaginacion.ts)
 * corta la lista y el componente `Paginacion` dibuja "Mostrando 1–10 de 47"
 * y los botones.
 *
 * Uso:
 *   const pag = usePaginacion(filtrados, 10, [busqueda, filtro]);
 *   <div ref={pag.refLista}>{pag.visibles.map(...)}</div>
 *   <Paginacion {...pag.props} etiqueta="usuarios" />
 * ========================================================================= */

import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Números a mostrar: 1 … 4 5 6 … 12 (siempre primera, última y vecinas). */
function rango(pagina: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const r: (number | '…')[] = [1];
  const desde = Math.max(2, pagina - 1);
  const hasta = Math.min(total - 1, pagina + 1);
  if (desde > 2) r.push('…');
  for (let i = desde; i <= hasta; i++) r.push(i);
  if (hasta < total - 1) r.push('…');
  r.push(total);
  return r;
}

export function Paginacion({ pagina, totalPaginas, total, porPagina, onCambiar, etiqueta = 'resultados', className = '' }: {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  onCambiar: (n: number) => void;
  /** Qué se cuenta: "usuarios", "proyectos"… */
  etiqueta?: string;
  className?: string;
}) {
  if (total <= porPagina) return null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);
  const boton = 'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label={`Paginación de ${etiqueta}`} className={`mt-6 flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <p className="text-sm text-muted-foreground tabular-nums">
        Mostrando <b className="text-foreground">{desde}–{hasta}</b> de <b className="text-foreground">{total}</b> {etiqueta}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className={`${boton} text-muted-foreground hover:bg-primary-subtle hover:text-primary`} onClick={() => onCambiar(pagina - 1)} disabled={pagina === 1} aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {rango(pagina, totalPaginas).map((n, i) => n === '…'
          ? <span key={`e${i}`} className="px-1 text-sm text-muted-foreground" aria-hidden="true">…</span>
          : (
            <button
              key={n}
              type="button"
              onClick={() => onCambiar(n)}
              aria-current={n === pagina ? 'page' : undefined}
              aria-label={`Página ${n}`}
              className={`${boton} tabular-nums ${n === pagina ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground hover:bg-primary-subtle hover:text-primary'}`}
            >
              {n}
            </button>
          ))}
        <button type="button" className={`${boton} text-muted-foreground hover:bg-primary-subtle hover:text-primary`} onClick={() => onCambiar(pagina + 1)} disabled={pagina === totalPaginas} aria-label="Página siguiente">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
