/* ============================================================================
 * src/shared/components/dashboard/AnalyticsCharts.tsx
 *
 * Primitivas de visualización del panel, siguiendo la guía de dataviz:
 *  - la FORMA la decide el trabajo del dato (magnitud → barras; tendencia →
 *    columnas por mes; parte-del-todo/estado → barra segmentada).
 *  - color por trabajo: una serie = un color (slot 1); varias series =
 *    slots categóricos validados (--chart-1..5); estado = tokens semánticos.
 *  - marcas finas, extremo redondeado 4px anclado a la línea base, rejilla
 *    hairline recesiva, hueco de 2px en color de superficie entre marcas.
 *  - el valor SIEMPRE es legible sin tooltip (etiqueta directa en la barra).
 * ========================================================================= */

import type { ReactNode } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card } from '@/shared/components/ui/Card';
import { compactNumber } from '@/shared/utils/numberFormat';

/* ---------- marco de tarjeta ---------- */

export function ChartFrame({
  title, subtitle, children, action, id,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <Card className="p-5 border-none shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
        {children}
      </Card>
    </div>
  );
}

/* ---------- barras horizontales ordenadas (magnitud, 1 serie) ----------
 * Una serie ⇒ sin caja de leyenda: el título nombra lo que se mide. */

export interface RankedDatum {
  label: string;
  value: number;
  /** Texto opcional bajo la etiqueta (p. ej. "3 empresas"). */
  hint?: string;
}

export function RankedBars({
  data,
  colorVar = 'var(--color-chart-1)',
  format = (n) => compactNumber(n),
  emptyLabel = 'Sin datos todavía',
}: {
  data: RankedDatum[];
  colorVar?: string;
  format?: (n: number) => string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const pct = Math.max(2, (d.value / max) * 100);
        return (
          <li key={d.label} className="grid grid-cols-[9rem_1fr] items-center gap-3 sm:grid-cols-[11rem_1fr]">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground" title={d.label}>{d.label}</p>
              {d.hint && <p className="truncate text-[10px] text-muted-foreground">{d.hint}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 flex-1 rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: colorVar }}
                />
              </div>
              <span className="w-12 flex-shrink-0 text-right text-xs font-bold tabular-nums text-foreground">
                {format(d.value)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- barra segmentada parte-del-todo / estado ----------
 * ≥2 segmentos ⇒ leyenda siempre presente (dot + etiqueta + conteo). Para
 * ESTADO se pasan tokens semánticos; para identidad, slots --chart-*. */

export interface Segment {
  label: string;
  value: number;
  colorVar: string;
}

export function SegmentedBar({
  segments,
  emptyLabel = 'Sin datos todavía',
}: {
  segments: Segment[];
  emptyLabel?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">{emptyLabel}</p>;
  }
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
        {shown.map((s) => (
          <div
            key={s.label}
            style={{ flexGrow: s.value, backgroundColor: s.colorVar }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: s.colorVar }} />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-bold tabular-nums text-foreground">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- columnas agrupadas por mes (tendencia, ≤3 series) ---------- */

export interface MonthlySeries {
  key: string;
  name: string;
  colorVar: string;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgb(0 0 0 / 0.10)',
} as const;

export function MonthlyColumns({
  data,
  series,
  height = 260,
}: {
  data: Array<Record<string, string | number>>;
  series: MonthlySeries[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={2} barCategoryGap="24%" margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
        />
        <YAxis
          allowDecimals={false}
          width={40}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
        <Legend
          verticalAlign="top"
          align="left"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}
        />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.colorVar} radius={[3, 3, 0, 0]} maxBarSize={22} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
