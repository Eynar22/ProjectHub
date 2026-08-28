/* ============================================================================
 * src/shared/constants/proyecto.ts
 * Constantes del dominio proyecto compartidas por varias pantallas
 * (crear proyecto, explorar, wizard de bienvenida, listados con estado).
 * ========================================================================= */

import type { BadgeVariant } from '@/shared/components/ui/Badge';

/** Categorías / sectores válidos para un proyecto. Debe coincidir con el
 *  default del backend (proyecto.entity: categoria = 'Tecnología'). */
export const PROJECT_CATEGORIES = [
  'Tecnología',
  'Medio Ambiente',
  'Salud',
  'Educación',
  'Finanzas',
  'Arte y Cultura',
  'Impacto Social',
  'Ciencia',
  'Deportes',
  'Entretenimiento',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/* --- Estado de dominio → cómo se pinta en un <Badge> --------------------- */

export const PROYECTO_ESTADO: Record<string, { variant: BadgeVariant; label: string }> = {
  en_curso: { variant: 'info', label: 'En Curso' },
  terminado: { variant: 'success', label: 'Terminado' },
  archivado: { variant: 'neutral', label: 'Archivado' },
};

export const SOLICITUD_ESTADO: Record<string, { variant: BadgeVariant; label: string }> = {
  pendiente: { variant: 'warning', label: 'Pendiente' },
  aceptado: { variant: 'success', label: 'Aceptada' },
  aprobado: { variant: 'success', label: 'Aprobada' },
  rechazado: { variant: 'danger', label: 'Rechazada' },
};

export const TAREA_PRIORIDAD: Record<string, { variant: BadgeVariant; label: string }> = {
  alta: { variant: 'danger', label: 'Alta' },
  media: { variant: 'warning', label: 'Media' },
  baja: { variant: 'info', label: 'Baja' },
};
