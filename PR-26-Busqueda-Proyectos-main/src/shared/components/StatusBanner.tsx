import type { ComponentType, ReactNode } from 'react';

/**
 * Aviso de estado de una vista (suspendido, archivado, terminado, solo lectura…).
 * Reemplaza los banners hechos a mano, cada uno con su propio estilo.
 */

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBannerProps {
  tone?: Tone;
  icon?: ComponentType<{ className?: string }>;
  title: string;
  children?: ReactNode;
  className?: string;
}

const TONE: Record<Tone, string> = {
  info: 'bg-info-subtle border-info/30 text-info-strong',
  success: 'bg-success-subtle border-success/30 text-success-strong',
  warning: 'bg-warning-subtle border-warning/30 text-warning-strong',
  danger: 'bg-danger-subtle border-danger/30 text-danger-strong',
  neutral: 'bg-muted border-border text-foreground',
};

export function StatusBanner({ tone = 'neutral', icon: Icon, title, children, className = '' }: StatusBannerProps) {
  return (
    <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${TONE[tone]} ${className}`}>
      {Icon && <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />}
      <div className="min-w-0">
        <h3 className="font-semibold">{title}</h3>
        {children && <p className="mt-0.5 text-sm opacity-90">{children}</p>}
      </div>
    </div>
  );
}
