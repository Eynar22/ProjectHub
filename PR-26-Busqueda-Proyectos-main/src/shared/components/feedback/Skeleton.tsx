/* Bloque gris con la forma del contenido real. Reduce la percepción de espera
 * y evita saltos de layout (Manual 8.9 / 12.2). */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      aria-hidden="true"
    />
  );
}
