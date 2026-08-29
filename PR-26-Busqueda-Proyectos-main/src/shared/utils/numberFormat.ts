/* ============================================================================
 * src/shared/utils/numberFormat.ts
 * Formato compacto de números para métricas y ejes de gráficas.
 * ========================================================================= */

/** 1284 → "1.3K" · 4_200_000 → "4.2M" · 42 → "42". */
export function compactNumber(n: number): string {
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(n));
}

/** Igual que compactNumber pero con prefijo "$". */
export function compactMoney(n: number): string {
  return `$${compactNumber(n)}`;
}
