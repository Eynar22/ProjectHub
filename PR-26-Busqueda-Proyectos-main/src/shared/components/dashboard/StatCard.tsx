import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { Card } from '@/shared/components/ui/Card';

/**
 * Tarjeta de métrica de un panel. Mismo componente en todos los dashboards
 * (empresa y plataforma) para que las vistas dejen de divergir.
 *
 * - `tone` colorea el tile del icono; `muted` = métrica en reposo (icono gris).
 * - `attention` añade un badge con el valor cuando hay algo que atender (> 0).
 * - `to` navega al hacer click; `#id` hace scroll suave a ese elemento.
 */

type Tone = 'primary' | 'success' | 'warning' | 'info' | 'muted';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
  attention?: boolean;
  to?: string;
}

const TILE: Record<Tone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  muted: 'bg-muted',
};

export function StatCard({ label, value, subtext, icon: Icon, tone = 'primary', attention = false, to }: StatCardProps) {
  const showBadge = attention && typeof value === 'number' && value > 0;

  const card = (
    <Card hover className="h-full p-6 flex flex-col justify-between border-none shadow-sm transition-all">
      <div className="mb-4 flex items-start justify-between">
        <div className={`relative flex h-12 w-12 items-center justify-center rounded-lg shadow-md ${TILE[tone]}`}>
          <Icon className={`h-6 w-6 ${tone === 'muted' ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
          {showBadge && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-primary-foreground shadow-lg ring-2 ring-background">
              {(value as number) > 9 ? '9+' : value}
            </span>
          )}
        </div>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mb-1 text-3xl font-black tracking-tight tabular-nums">{value}</p>
        {subtext && <p className="text-[11px] font-medium text-muted-foreground">{subtext}</p>}
      </div>
    </Card>
  );

  if (to?.startsWith('#')) {
    const id = to.slice(1);
    return (
      <button
        type="button"
        className="h-full w-full text-left"
        onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
      >
        {card}
      </button>
    );
  }
  if (to) {
    return <Link to={to} className="block h-full">{card}</Link>;
  }
  return <div className="block h-full">{card}</div>;
}
