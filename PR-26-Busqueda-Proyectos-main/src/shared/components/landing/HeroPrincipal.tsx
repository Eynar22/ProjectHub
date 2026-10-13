/* ============================================================================
 * src/shared/components/landing/HeroPrincipal.tsx
 * Hero de la portada. Fórmula clásica: texto a la izquierda (título corto,
 * una frase, un botón principal) y personas a la derecha, en marcos
 * redondeados con formas de color detrás. Fondo oscuro limpio.
 * Fotos: Unsplash (public/images/landing/).
 * ========================================================================= */

import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const entrar = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function HeroPrincipal() {
  return (
    <section className="dark relative min-h-[100dvh] w-full overflow-hidden bg-[#05050A] text-white">
      {/* Fondo: un resplandor y una trama de puntos muy suave */}
      <div aria-hidden="true" className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-primary/20 blur-[140px]" />
      <div aria-hidden="true" className="absolute bottom-0 right-0 w-[35rem] h-[35rem] rounded-full bg-indigo-500/10 blur-[140px]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.7)_1px,transparent_0)] [background-size:28px_28px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[100dvh] grid lg:grid-cols-2 gap-12 items-center pt-28 pb-16">
        {/* Texto */}
        <div className="max-w-xl">
          <motion.h1 {...entrar(0)} className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            Publica tu problema.<br />
            <span className="text-primary italic font-serif">Encuentra quién</span><br />
            lo resuelve.
          </motion.h1>

          <motion.p {...entrar(0.15)} className="text-lg md:text-xl text-slate-300 leading-relaxed mb-10 max-w-md">
            Empresas con problemas reales y profesionales que saben resolverlos, trabajando juntos en un solo lugar.
          </motion.p>

          <motion.div {...entrar(0.3)} className="flex flex-wrap items-center gap-6">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-indigo-600 shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all"
            >
              Crear cuenta <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/explore" className="group inline-flex items-center gap-1.5 text-base font-semibold text-slate-200 hover:text-white">
              Ver proyectos abiertos
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Personas */}
        <Fotos />
      </div>
    </section>
  );
}

function Fotos() {
  const reducir = useReducedMotion();
  const flotar = (d: number) =>
    reducir ? {} : { animate: { y: [0, -10, 0] }, transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const, delay: d } };

  return (
    <div className="relative hidden lg:block h-[560px]" aria-hidden="true">
      {/* Foto grande: equipo trabajando */}
      <motion.div {...entrar(0.2)} className="absolute left-[4%] top-[8%] w-[50%] h-[84%]">
        <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-full bg-primary" />
        <motion.div {...flotar(0)} className="relative h-full rounded-full overflow-hidden border-4 border-[#05050A]">
          <img src="/images/landing/equipos.jpg" alt="" className="w-full h-full object-cover object-[45%_center]" />
        </motion.div>
      </motion.div>

      {/* Arriba a la derecha: profesional */}
      <motion.div {...entrar(0.35)} className="absolute right-[2%] top-0 w-[36%] h-[46%]">
        <div className="absolute inset-0 -translate-x-3 translate-y-3 rounded-full bg-amber-400" />
        <motion.div {...flotar(1.5)} className="relative h-full rounded-full overflow-hidden border-4 border-[#05050A]">
          <img src="/images/landing/profesionales.jpg" alt="" className="w-full h-full object-cover object-[57%_center]" />
        </motion.div>
      </motion.div>

      {/* Abajo a la derecha: empresa en reunión */}
      <motion.div {...entrar(0.5)} className="absolute right-[6%] bottom-0 w-[38%] aspect-square">
        <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-full bg-emerald-400" />
        <motion.div {...flotar(3)} className="relative h-full rounded-full overflow-hidden border-4 border-[#05050A]">
          <img src="/images/landing/empresas.jpg" alt="" className="w-full h-full object-cover object-[48%_center]" />
        </motion.div>
      </motion.div>

      {/* Etiqueta flotante */}
      <motion.div
        {...entrar(0.8)}
        className="absolute left-0 bottom-[14%] flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-2xl"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Propuesta aceptada
      </motion.div>

      {/* Detalles decorativos */}
      <div className="absolute right-[44%] top-[2%] w-6 h-6 rounded-full border-4 border-amber-400" />
      <div className="absolute right-0 top-[52%] grid grid-cols-4 gap-2 opacity-60">
        {Array.from({ length: 12 }).map((_, i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-300" />)}
      </div>
    </div>
  );
}
