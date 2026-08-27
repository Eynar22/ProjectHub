import { Skeleton } from './Skeleton';

/* Estado de carga (Manual 8.9): skeleton con la forma del contenido, no un
 * spinner centrado. `filas` controla cuántos bloques mostrar. */
export function EstadoCargando({
  filas = 3,
  className = '',
}: {
  filas?: number;
  className?: string;
}) {
  return (
    <div
      className={`space-y-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
