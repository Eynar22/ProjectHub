/* ============================================================================
 * src/shared/components/landing/FraseImpacto.tsx
 * Sección "respiro" entre bloques: una sola frase grande, a pantalla completa,
 * cuyas palabras se van iluminando a medida que se hace scroll.
 * ========================================================================= */

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';

const FRASE = 'Bolivia tiene problemas reales, y gente capaz de resolverlos.';
// Palabras que se destacan en azul.
const DESTACADAS = new Set(['gente', 'capaz', 'resolverlos.']);

export function FraseImpacto() {
  const ref = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 55%'] });
  const palabras = FRASE.split(' ');

  return (
    <section className="relative z-20 bg-[#05050A] border-y border-white/5 py-32 md:py-44 overflow-hidden">
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[30rem] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />
      <div ref={ref} className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-serif leading-[1.15] tracking-tight text-center">
          {palabras.map((p, i) => (
            <Palabra
              key={i}
              texto={p}
              destacada={DESTACADAS.has(p)}
              progreso={scrollYProgress}
              rango={[i / palabras.length, (i + 1) / palabras.length]}
              estatica={!!reducir}
            />
          ))}
        </p>
      </div>
    </section>
  );
}

function Palabra({ texto, destacada, progreso, rango, estatica }: {
  texto: string;
  destacada: boolean;
  progreso: MotionValue<number>;
  rango: [number, number];
  estatica: boolean;
}) {
  const opacidad = useTransform(progreso, rango, [0.15, 1]);
  return (
    <motion.span
      style={estatica ? undefined : { opacity: opacidad }}
      className={`inline-block mr-[0.25em] ${destacada ? 'text-primary italic' : 'text-white'}`}
    >
      {texto}
    </motion.span>
  );
}
