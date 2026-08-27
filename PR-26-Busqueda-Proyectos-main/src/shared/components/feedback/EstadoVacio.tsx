import type { ComponentType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';

/* Estado vacío (Manual 8.9): icono + título + una frase + acción para crear el
 * primer elemento. Nunca dejar un espacio en blanco. */
export function EstadoVacio({
  icono: Icono = Inbox,
  titulo,
  descripcion,
  accion,
  className = '',
}: {
  icono?: ComponentType<{ className?: string }>;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icono className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{titulo}</h3>
      {descripcion && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">{descripcion}</p>
      )}
      {accion}
    </div>
  );
}
