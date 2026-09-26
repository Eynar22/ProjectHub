/* ============================================================================
 * src/shared/components/landing/CtaFinal.tsx
 * Cierre del landing: dos caminos ("Tengo un problema" / "Tengo la solución")
 * como tarjetas con un foco de luz que sigue al mouse, sobre un fondo aurora
 * animado, y una cinta con los proyectos reales que hoy buscan solución (si no
 * hay, muestra los ODS). Respeta prefers-reduced-motion.
 * ========================================================================= */

import { type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react';
import { ArrowRight, Building2, CheckCircle2, Lightbulb, type LucideIcon } from 'lucide-react';
import type { Project } from '@/features/proyectos';
import { ODS_LIST } from '@/shared/constants/ods';
import { Reveal } from '@/shared/components/Reveal';

interface Camino {
  icon: LucideIcon;
  etiqueta: string;
  titulo: string;
  puntos: string[];
  cta: string;
  to: string;
  color: string; // r,g,b
  principal?: boolean;
}

const CAMINOS: Camino[] = [
  {
    icon: Building2,
    etiqueta: 'Soy una empresa',
    titulo: 'Tengo un problema',
    puntos: ['Publica tu proyecto con el problema a resolver', 'Recibe propuestas de profesionales y equipos', 'Trabaja con el elegido en un solo lugar'],
    cta: 'Registrar mi empresa',
    to: '/register',
    color: '37,99,235',
    principal: true,
  },
  {
    icon: Lightbulb,
    etiqueta: 'Soy profesional',
    titulo: 'Tengo la solución',
    puntos: ['Explora proyectos que buscan solución', 'Postula con tu propuesta y tu CV', 'Súmate al equipo si te eligen'],
    cta: 'Ver proyectos abiertos',
    to: '/explore',
    color: '139,92,246',
  },
];

export function CtaFinal({ proyectos }: { proyectos: Project[] }) {
  const reducir = useReducedMotion();
  const abiertos = proyectos.filter((p) => p.estado === 'en_curso' && !p.suspendido).slice(0, 12);

  return (
    <section className="relative z-20 overflow-hidden border-t border-border bg-[#05050A] py-24 md:py-32">
      {/* Fondo aurora: manchas de color que se desplazan despacio */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-1/3 -left-1/4 w-[60rem] h-[60rem] rounded-full bg-primary/25 blur-[160px]"
          animate={reducir ? undefined : { x: [0, 120, 0], y: [0, 60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/3 -right-1/4 w-[55rem] h-[55rem] rounded-full bg-violet-600/20 blur-[160px]"
          animate={reducir ? undefined : { x: [0, -100, 0], y: [0, -80, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.7)_1px,transparent_0)] [background-size:26px_26px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Empieza hoy</p>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05] mb-5">
            ¿Tienes un problema <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 via-primary to-violet-400 bg-clip-text text-transparent italic font-serif font-normal">
              o la solución?
            </span>
          </h2>
          <p className="text-lg text-slate-300">Elige tu camino. Crear la cuenta toma un par de minutos.</p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {CAMINOS.map((c, i) => (
            <Reveal key={c.titulo} delay={i * 0.12} className="h-full">
              <TarjetaCamino camino={c} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Cinta: lo que hoy busca solución */}
      <div className="relative z-10 mt-16">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          {abiertos.length > 0 ? 'Ahora mismo buscan solución' : 'Los 17 Objetivos de Desarrollo Sostenible'}
        </p>
        <Cinta reducir={!!reducir}>
          {abiertos.length > 0
            ? abiertos.map((p) => (
                <Link
                  key={p.id}
                  to={`/project/${p.id}`}
                  className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 hover:border-white/25 transition-colors"
                >
                  {p.ods?.[0] && <img src={`/images/ods/${p.ods[0]}.png`} alt="" className="w-5 h-5 rounded" />}
                  {p.nombre}
                </Link>
              ))
            : ODS_LIST.map((o) => (
                <span key={o.id} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
                  <img src={`/images/ods/${o.id}.png`} alt="" className="w-6 h-6 rounded" />
                  {o.nombre}
                </span>
              ))}
        </Cinta>
      </div>
    </section>
  );
}

/** Carrusel infinito horizontal. Se duplica el contenido para que el bucle no tenga saltos. */
function Cinta({ children, reducir }: { children: ReactNode; reducir: boolean }) {
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-3 w-max"
        animate={reducir ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <div className="flex gap-3">{children}</div>
        <div className="flex gap-3" aria-hidden="true">{children}</div>
      </motion.div>
    </div>
  );
}

function TarjetaCamino({ camino: c }: { camino: Camino }) {
  // Foco de luz que sigue al mouse dentro de la tarjeta.
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const foco = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, rgba(${c.color},0.28), transparent 70%)`;

  const mover = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <motion.div
      onMouseMove={mover}
      onMouseLeave={() => { mx.set(-400); my.set(-400); }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      className="group relative h-full rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 md:p-10 overflow-hidden"
      style={{ ['--c' as string]: c.color }}
    >
      <motion.div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: foco }} />
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 0 1px rgba(${c.color},0.6)` }}
      />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
            style={{ backgroundColor: `rgb(${c.color})` }}
          >
            <c.icon className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: `rgb(${c.color})` }}>{c.etiqueta}</span>
        </div>

        <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-6">{c.titulo}</h3>

        <ul className="space-y-3 mb-8">
          {c.puntos.map((p) => (
            <li key={p} className="flex items-start gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: `rgb(${c.color})` }} />
              {p}
            </li>
          ))}
        </ul>

        <Link
          to={c.to}
          className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold transition-all duration-300 ${
            c.principal
              ? 'bg-primary text-white shadow-[0_0_40px_rgba(37,99,235,0.45)] hover:shadow-[0_0_60px_rgba(37,99,235,0.65)]'
              : 'border border-white/25 text-white hover:bg-white/10'
          }`}
        >
          {c.cta}
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
}
