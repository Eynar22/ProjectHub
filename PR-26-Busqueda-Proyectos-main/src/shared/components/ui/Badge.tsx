import type { ReactNode } from 'react';

/**
 * Etiqueta de estado (Anexo A9 / Manual 8). Un único patrón para todos los
 * chips de la app: fondo `-subtle`, texto `-strong`, borde `/30`. Reemplaza
 * las variantes sueltas escritas a mano (`bg-warning/15 text-warning`…).
 *
 * `variant` es semántico, no decorativo: elige uno de los 4 fijos o `neutral`.
 * Para estados de dominio usa los mapas de abajo en vez de repetir literales.
 */

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  variant?: BadgeVariant;
  /** Chip más pequeño (tablas densas, tarjetas compactas). */
  size?: 'sm' | 'md';
  /** Llama la atención sobre algo nuevo/pendiente. Úsalo con moderación. */
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-muted-foreground border-border',
  info: 'bg-info-subtle text-info-strong border-info/30',
  success: 'bg-success-subtle text-success-strong border-success/30',
  warning: 'bg-warning-subtle text-warning-strong border-warning/30',
  danger: 'bg-danger-subtle text-danger-strong border-danger/30',
};

const SIZES = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
} as const;

export function Badge({
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold leading-none whitespace-nowrap ${
        VARIANTS[variant]
      } ${SIZES[size]} ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      {children}
    </span>
  );
}
