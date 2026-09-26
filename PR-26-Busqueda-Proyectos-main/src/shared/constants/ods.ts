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
  /** Objetivo resumido, según la formulación oficial de la ONU. */
  meta: string;
}

export const ODS_LIST: readonly Ods[] = [
  { id: 1,  nombre: 'Fin de la pobreza',                            color: '#E5243B', meta: 'Poner fin a la pobreza en todas sus formas en todo el mundo.' },
  { id: 2,  nombre: 'Hambre cero',                                  color: '#DDA63A', meta: 'Poner fin al hambre, lograr la seguridad alimentaria y promover la agricultura sostenible.' },
  { id: 3,  nombre: 'Salud y bienestar',                            color: '#4C9F38', meta: 'Garantizar una vida sana y promover el bienestar para todos en todas las edades.' },
  { id: 4,  nombre: 'Educación de calidad',                         color: '#C5192D', meta: 'Garantizar una educación inclusiva, equitativa y de calidad para todos.' },
  { id: 5,  nombre: 'Igualdad de género',                           color: '#FF3A21', meta: 'Lograr la igualdad entre los géneros y empoderar a todas las mujeres y niñas.' },
  { id: 6,  nombre: 'Agua limpia y saneamiento',                    color: '#26BDE2', meta: 'Garantizar la disponibilidad y la gestión sostenible del agua y el saneamiento para todos.' },
  { id: 7,  nombre: 'Energía asequible y no contaminante',          color: '#FCC30B', meta: 'Garantizar el acceso a una energía asequible, segura, sostenible y moderna.' },
  { id: 8,  nombre: 'Trabajo decente y crecimiento económico',      color: '#A21942', meta: 'Promover el crecimiento económico sostenible, el empleo pleno y el trabajo decente para todos.' },
  { id: 9,  nombre: 'Industria, innovación e infraestructura',      color: '#FD6925', meta: 'Construir infraestructuras resilientes, promover la industrialización sostenible y fomentar la innovación.' },
  { id: 10, nombre: 'Reducción de las desigualdades',               color: '#DD1367', meta: 'Reducir la desigualdad en y entre los países.' },
  { id: 11, nombre: 'Ciudades y comunidades sostenibles',           color: '#FD9D24', meta: 'Lograr que las ciudades sean inclusivas, seguras, resilientes y sostenibles.' },
  { id: 12, nombre: 'Producción y consumo responsables',            color: '#BF8B2E', meta: 'Garantizar modalidades de consumo y producción sostenibles.' },
  { id: 13, nombre: 'Acción por el clima',                          color: '#3F7E44', meta: 'Adoptar medidas urgentes para combatir el cambio climático y sus efectos.' },
  { id: 14, nombre: 'Vida submarina',                               color: '#0A97D9', meta: 'Conservar y utilizar de forma sostenible los océanos, los mares y los recursos marinos.' },
  { id: 15, nombre: 'Vida de ecosistemas terrestres',              color: '#56C02B', meta: 'Proteger los ecosistemas terrestres, gestionar los bosques y detener la pérdida de biodiversidad.' },
  { id: 16, nombre: 'Paz, justicia e instituciones sólidas',        color: '#00689D', meta: 'Promover sociedades pacíficas e inclusivas, con acceso a la justicia e instituciones eficaces.' },
  { id: 17, nombre: 'Alianzas para lograr los objetivos',           color: '#19486A', meta: 'Fortalecer las alianzas mundiales para el desarrollo sostenible.' },
] as const;

export const ODS_POR_ID: Record<number, Ods> = Object.fromEntries(
  ODS_LIST.map((o) => [o.id, o]),
);

/** Etiqueta corta "ODS 7" y nombre completo. */
export function etiquetaOds(id: number): string {
  const o = ODS_POR_ID[id];
  return o ? `ODS ${o.id}: ${o.nombre}` : `ODS ${id}`;
}
