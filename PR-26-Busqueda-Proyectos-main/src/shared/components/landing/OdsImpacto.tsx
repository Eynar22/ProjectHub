/* ============================================================================
 * src/shared/components/landing/OdsImpacto.tsx
 * Sección "Impacto Sostenible" del landing.
 *  - Resumen: proyectos con ODS, objetivos cubiertos (x/17) y el más trabajado.
 *  - Rueda con los 17 ODS como mapa de calor: los que tienen proyectos se ven
 *    vivos y con su número; los que no, atenuados. Recorre sola los ODS con
 *    proyectos hasta que el usuario interactúa. Se maneja con flechas.
 *  - Panel del ODS elegido: qué busca el objetivo (meta ONU), cuántos proyectos
 *    aportan, los proyectos reales y un enlace a Explorar filtrado (?ods=).
 *  - Móvil: la rueda se cambia por una tira deslizable (fichas más grandes).
 * Fondo sin imágenes externas: anillo con los colores oficiales de los ODS.
 * ========================================================================= */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Building2, Globe, Sparkles } from 'lucide-react';
import type { Project } from '@/features/proyectos';
import { ODS_LIST } from '@/shared/constants/ods';
import { ProjectImage } from '@/shared/components/ui/ProjectImage';
import { Reveal } from '@/shared/components/Reveal';

const ROTAR_MS = 3500;
// Anillo de fondo con los 17 colores oficiales, en orden.
const ANILLO = `conic-gradient(${ODS_LIST.map((o, i) => `${o.color} ${(i / 17) * 100}% ${((i + 1) / 17) * 100}%`).join(', ')})`;

export function OdsImpacto({ proyectos }: { proyectos: Project[] }) {
  const reducir = useReducedMotion();

  // Solo cuentan los proyectos visibles (en curso y no suspendidos).
  const visibles = useMemo(
    () => proyectos.filter((p) => p.estado === 'en_curso' && !p.suspendido),
    [proyectos],
  );
  const ods = useMemo(
    () =>
      ODS_LIST.map((o) => {
        const suyos = visibles.filter((p) => Array.isArray(p.ods) && p.ods.includes(o.id));
        return { ...o, total: suyos.length, proyectos: suyos };
      }),
    [visibles],
  );
  const conProyectos = ods.filter((o) => o.total > 0);
  const cubiertos = conProyectos.length;
  const proyectosConOds = visibles.filter((p) => Array.isArray(p.ods) && p.ods.length > 0).length;
  const masTrabajado = [...conProyectos].sort((a, b) => b.total - a.total)[0];

  const [activoId, setActivoId] = useState<number | null>(null);
  const [autoRotar, setAutoRotar] = useState(!reducir);
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  // Por defecto, el más trabajado (o el ODS 1 si aún no hay proyectos).
  const activo = ods.find((o) => o.id === (activoId ?? masTrabajado?.id ?? 1))!;

  // Recorrido automático por los ODS con proyectos (o por todos si no hay).
  useEffect(() => {
    if (!autoRotar) return;
    const ciclo = conProyectos.length > 1 ? conProyectos : ods;
    const t = setTimeout(() => {
      const i = ciclo.findIndex((o) => o.id === activo.id);
      setActivoId(ciclo[(i + 1) % ciclo.length].id);
    }, ROTAR_MS);
    return () => clearTimeout(t);
  }, [autoRotar, activo.id, conProyectos, ods]);

  const elegir = (id: number) => {
    setAutoRotar(false);
    setActivoId(id);
  };

  // Flechas: moverse al ODS anterior/siguiente.
  const teclado = (e: KeyboardEvent, i: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const sig = (i + delta + 17) % 17;
    elegir(ods[sig].id);
    botones.current[sig]?.focus();
  };

  return (
    <section id="impacto" className="scroll-mt-16 relative z-20 py-24 border-t border-border/50 overflow-hidden bg-background">
      {/* Fondo: anillo difuso con los colores de los ODS */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute left-1/2 top-[58%] w-[900px] h-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-[110px]"
          style={{ background: ANILLO }}
          animate={reducir ? undefined : { rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-10 max-w-3xl mx-auto">
          <p className="inline-flex items-center justify-center gap-2 text-sm font-bold text-primary uppercase tracking-widest mb-3">
            <Globe className="w-4 h-4" /> Impacto Sostenible
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">
            Aportando a los <span className="text-primary">ODS de la ONU</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Cada empresa indica a qué Objetivos de Desarrollo Sostenible aporta su proyecto. Elige un objetivo para ver quién está trabajando en él.
          </p>
        </Reveal>

        {/* Resumen */}
        <Reveal className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto mb-14">
          <Dato valor={proyectosConOds} etiqueta={proyectosConOds === 1 ? 'proyecto con ODS declarados' : 'proyectos con ODS declarados'} />
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur px-5 py-4">
            <p className="text-2xl font-extrabold text-foreground">
              {cubiertos}<span className="text-muted-foreground text-base font-semibold"> / 17</span>
            </p>
            <p className="text-xs font-semibold text-muted-foreground mb-2">objetivos cubiertos</p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                whileInView={{ width: `${(cubiertos / 17) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>
          {masTrabajado ? (
            <button
              type="button"
              onClick={() => elegir(masTrabajado.id)}
              className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur px-5 py-4 flex items-center gap-3 text-left hover:border-primary/50 transition-colors"
            >
              <img src={`/images/ods/${masTrabajado.id}.png`} alt="" className="w-11 h-11 rounded-lg flex-shrink-0" />
              <span>
                <span className="block text-xs font-semibold text-muted-foreground">El más trabajado</span>
                <span className="block text-sm font-bold text-foreground leading-tight">ODS {masTrabajado.id}: {masTrabajado.nombre}</span>
              </span>
            </button>
          ) : (
            <Dato valor="—" etiqueta="todavía sin proyectos con ODS" />
          )}
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ───── Rueda (tablet/escritorio) ───── */}
          <div
            className="hidden md:block relative w-full max-w-[540px] aspect-square mx-auto"
            role="radiogroup"
            aria-label="Objetivos de Desarrollo Sostenible"
            onMouseEnter={() => setAutoRotar(false)}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46%] h-[46%] rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.35)] border border-white/20 z-20">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activo.id}
                  src={`/images/ods/${activo.id}.png`}
                  alt=""
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            </div>

            {ods.map((o, i) => {
              const ang = ((i * 360) / 17 - 90) * (Math.PI / 180);
              const on = o.id === activo.id;
              const vacio = o.total === 0;
              return (
                <button
                  key={o.id}
                  ref={(el) => { botones.current[i] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => elegir(o.id)}
                  onKeyDown={(e) => teclado(e, i)}
                  title={o.nombre}
                  aria-label={`ODS ${o.id}: ${o.nombre}, ${o.total} ${o.total === 1 ? 'proyecto' : 'proyectos'}`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-[15%] aspect-square rounded-2xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    on ? 'scale-125 z-30' : 'hover:scale-110 hover:z-30'
                  }`}
                  style={{ left: `calc(50% + ${Math.cos(ang) * 44}%)`, top: `calc(50% + ${Math.sin(ang) * 44}%)` }}
                >
                  <img
                    src={`/images/ods/${o.id}.png`}
                    alt=""
                    className={`w-full h-full rounded-2xl object-cover shadow-lg border-2 transition-all duration-300 ${
                      on ? 'border-white' : 'border-transparent'
                    } ${vacio && !on ? 'opacity-35 grayscale-[70%]' : ''}`}
                  />
                  {o.total > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1.5 rounded-full bg-background text-foreground text-xs font-extrabold flex items-center justify-center shadow border border-border">
                      {o.total}
                    </span>
                  )}
                  {/* Pulso en el activo mientras recorre solo */}
                  {on && autoRotar && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-2xl border-2"
                      style={{ borderColor: o.color }}
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.35 }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ───── Tira deslizable (móvil) ───── */}
          <div className="md:hidden min-w-0 -mx-4 px-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none]">
            <div className="flex gap-3 w-max pb-2" role="radiogroup" aria-label="Objetivos de Desarrollo Sostenible">
              {ods.map((o) => {
                const on = o.id === activo.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => elegir(o.id)}
                    aria-label={`ODS ${o.id}: ${o.nombre}, ${o.total} ${o.total === 1 ? 'proyecto' : 'proyectos'}`}
                    className={`relative snap-start w-20 h-20 rounded-2xl flex-shrink-0 border-2 transition-all ${on ? 'border-foreground scale-105' : 'border-transparent'}`}
                  >
                    <img src={`/images/ods/${o.id}.png`} alt="" className={`w-full h-full rounded-2xl ${o.total === 0 && !on ? 'opacity-40 grayscale-[70%]' : ''}`} />
                    {o.total > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1.5 rounded-full bg-background text-foreground text-xs font-extrabold flex items-center justify-center shadow border border-border">
                        {o.total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ───── Panel del ODS elegido ───── */}
          <div aria-live="polite" className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activo.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 md:p-8 shadow-xl"
                style={{ borderTopColor: activo.color, borderTopWidth: 4 }}
              >
                <p className="text-sm font-extrabold uppercase tracking-widest mb-1" style={{ color: activo.color }}>
                  ODS {activo.id}
                </p>
                <h3 className="text-2xl md:text-3xl font-extrabold font-serif text-foreground mb-3">{activo.nombre}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{activo.meta}</p>

                {activo.total > 0 ? (
                  <>
                    <p className="text-sm font-bold text-foreground mb-3">
                      {activo.total} {activo.total === 1 ? 'proyecto aporta' : 'proyectos aportan'} a este objetivo
                    </p>
                    <div className="space-y-2 mb-6">
                      {activo.proyectos.slice(0, 3).map((p) => (
                        <Link
                          key={p.id}
                          to={`/project/${p.id}`}
                          className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-2.5 pr-4 hover:border-primary/50 hover:bg-background transition-colors"
                        >
                          <ProjectImage imagenes={p.imagenes} alt="" className="w-14 h-14 rounded-xl flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{p.nombre}</p>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              {p.creador?.empresa?.nombre ?? 'Empresa verificada'}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                    <Link
                      to={`/explore?ods=${activo.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
                    >
                      {activo.total > 3 ? `Ver los ${activo.total} proyectos` : 'Ver en Explorar'}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-foreground mb-1">
                      <Sparkles className="w-4 h-4 text-primary" /> Todavía nadie trabaja en este objetivo
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      ¿Tu empresa tiene un proyecto que aporte aquí? Publícalo y sé el primero.
                    </p>
                    <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                      Publicar un proyecto <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dato({ valor, etiqueta }: { valor: number | string; etiqueta: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur px-5 py-4">
      <p className="text-2xl font-extrabold text-foreground">{valor}</p>
      <p className="text-xs font-semibold text-muted-foreground">{etiqueta}</p>
    </div>
  );
}
