import type { ComponentType, ReactNode } from 'react';
import { Badge, type BadgeVariant } from '@/shared/components/ui/Badge';

/**
 * Bloque de un panel: encabezado consistente (título + subtítulo + contador +
 * acción) y el contenido debajo. Reemplaza los encabezados a mano que tenía
 * cada sección de cada dashboard con tamaños y estilos distintos.
 *
 * Orden que imponen los paneles con este componente:
 *   necesita tu atención → tu trabajo → contexto / monitoreo.
 */

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  /** Color del icono (ej. 'text-warning'). Por defecto neutro. */
  iconClassName?: string;
  /** Contador junto al título; se oculta si es 0 o indefinido. */
  count?: number;
  countTone?: BadgeVariant;
  /** Acción a la derecha, normalmente un enlace "Ver todo". */
  action?: ReactNode;
  /** Ancla para scroll desde una StatCard. */
  id?: string;
  className?: string;
  children: ReactNode;
}

export function DashboardSection({
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'text-muted-foreground',
  count,
  countTone = 'info',
  action,
  id,
  className = '',
  children,
}: DashboardSectionProps) {
  return (
    <section id={id} className={`mb-8 scroll-mt-24 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            {Icon && <Icon className={`h-5 w-5 flex-shrink-0 ${iconClassName}`} />}
            <span className="truncate">{title}</span>
            {count !== undefined && count > 0 && (
              <Badge variant={countTone} className="ml-1">{count}</Badge>
            )}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
