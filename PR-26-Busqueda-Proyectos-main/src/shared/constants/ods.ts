/* ============================================================================
 * src/shared/constants/ods.ts
 * Los 17 Objetivos de Desarrollo Sostenible (ODS) de la ONU. Un proyecto puede
 * declarar a qué ODS aporta (campo `ods: number[]` en la entidad Proyecto).
 * Colores oficiales de la ONU para las insignias y la sección de impacto del
 * landing.
 * ========================================================================= */

export interface Ods {
  id: number;
  nombre: string;
  color: string;
}

export const ODS_LIST: readonly Ods[] = [
  { id: 1,  nombre: 'Fin de la pobreza',                            color: '#E5243B' },
  { id: 2,  nombre: 'Hambre cero',                                  color: '#DDA63A' },
  { id: 3,  nombre: 'Salud y bienestar',                            color: '#4C9F38' },
  { id: 4,  nombre: 'Educación de calidad',                         color: '#C5192D' },
  { id: 5,  nombre: 'Igualdad de género',                           color: '#FF3A21' },
  { id: 6,  nombre: 'Agua limpia y saneamiento',                    color: '#26BDE2' },
  { id: 7,  nombre: 'Energía asequible y no contaminante',          color: '#FCC30B' },
  { id: 8,  nombre: 'Trabajo decente y crecimiento económico',      color: '#A21942' },
  { id: 9,  nombre: 'Industria, innovación e infraestructura',      color: '#FD6925' },
  { id: 10, nombre: 'Reducción de las desigualdades',               color: '#DD1367' },
  { id: 11, nombre: 'Ciudades y comunidades sostenibles',           color: '#FD9D24' },
  { id: 12, nombre: 'Producción y consumo responsables',            color: '#BF8B2E' },
  { id: 13, nombre: 'Acción por el clima',                          color: '#3F7E44' },
  { id: 14, nombre: 'Vida submarina',                               color: '#0A97D9' },
  { id: 15, nombre: 'Vida de ecosistemas terrestres',              color: '#56C02B' },
  { id: 16, nombre: 'Paz, justicia e instituciones sólidas',        color: '#00689D' },
  { id: 17, nombre: 'Alianzas para lograr los objetivos',           color: '#19486A' },
] as const;

export const ODS_POR_ID: Record<number, Ods> = Object.fromEntries(
  ODS_LIST.map((o) => [o.id, o]),
);

/** Etiqueta corta "ODS 7" y nombre completo. */
export function etiquetaOds(id: number): string {
  const o = ODS_POR_ID[id];
  return o ? `ODS ${o.id}: ${o.nombre}` : `ODS ${id}`;
}
