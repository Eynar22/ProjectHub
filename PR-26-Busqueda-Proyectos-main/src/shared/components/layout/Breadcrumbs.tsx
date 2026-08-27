import { Fragment } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

export interface Miga {
  /** Texto visible. */
  label: string;
  /** Ruta destino. La última miga (página actual) va sin `to`. */
  to?: string;
}

/* Migas de pan (Manual 3.1 - OBLIGATORIO en páginas internas).
 * Formato: Inicio > Categoría > Página actual. La actual NO es enlace. */
export function Breadcrumbs({ items, className = '' }: { items: Miga[]; className?: string }) {
  return (
    <nav aria-label="Ruta de navegación" className={`mb-4 text-sm ${className}`}>
      <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
        {items.map((item, i) => {
          const esUltima = i === items.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              )}
              <li>
                {esUltima || !item.to ? (
                  <span aria-current="page" className="font-medium text-foreground">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.to}
                    className="rounded transition-colors hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
