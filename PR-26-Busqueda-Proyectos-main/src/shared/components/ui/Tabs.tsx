import type { ComponentType } from 'react';
import { Badge } from './Badge';

/**
 * Barra de pestañas con subrayado. Un solo patrón para toda la app
 * (Workspace, listados con filtros…). Scrollea en horizontal cuando no caben.
 */

export interface TabItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  /** Contador junto a la etiqueta; se oculta si es 0. */
  badge?: number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`border-b border-border ${className}`}>
      <div className="-mb-px flex gap-1 overflow-x-auto" role="tablist">
        {tabs.map(({ id, label, icon: Icon, badge }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              className={`flex flex-shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {label}
              {badge !== undefined && badge > 0 && (
                <Badge variant="warning" size="sm">{badge}</Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
