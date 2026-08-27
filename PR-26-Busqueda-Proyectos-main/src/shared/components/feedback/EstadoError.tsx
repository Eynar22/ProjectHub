import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

/* Estado de error (Manual 8.9): qué falló + qué hacer + botón Reintentar.
 * Nunca mostrar el error técnico crudo al usuario final. */
export function EstadoError({
  titulo = 'No pudimos cargar esta información',
  descripcion = 'Revisa tu conexión e inténtalo de nuevo.',
  onReintentar,
  className = '',
}: {
  titulo?: string;
  descripcion?: string;
  onReintentar?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-subtle">
        <AlertCircle className="h-7 w-7 text-danger-strong" aria-hidden="true" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{titulo}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{descripcion}</p>
      {onReintentar && (
        <Button variant="secondary" onClick={onReintentar}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
