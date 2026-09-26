/* ============================================================================
 * src/shared/components/landing/PorQueExiste.tsx
 * Sección "Por qué existe" del landing: del caos al orden, contado con scroll.
 * Escritorio: piezas sueltas (correos, WhatsApp, Excel, PDF) flotan
 * desordenadas a la izquierda y, al bajar, vuelan y se acomodan dentro de un
 * proyecto de ProjectHub, donde cada una se convierte en su versión ordenada.
 * Móvil / reducir movimiento: "Hoy" y "Con ProjectHub" lado a lado, sin vuelo.
 * ========================================================================= */

import { useRef } from 'react';
import {
  motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue,
} from 'motion/react';
import {
  CheckCircle2, FileSpreadsheet, FileText, FolderOpen, ListChecks, Mail,
  MessageCircle, MessageSquare, UserCheck, type LucideIcon,
} from 'lucide-react';

interface Pieza {
  icon: LucideIcon;
  iconColor: string;
  caos: string;
  orden: string;
  ordenIcon: LucideIcon;
  // Posición desordenada (% del ancho, px de alto, grados)
  x: number; y: number; rot: number;
}

const PIEZAS: Pieza[] = [
  { icon: Mail, iconColor: '#ef4444', caos: 'RE: RE: FW: propuesta final (v3)', orden: '3 propuestas recibidas', ordenIcon: FileText, x: 2, y: 30, rot: -8 },
  { icon: MessageCircle, iconColor: '#22c55e', caos: '¿Alguien tiene el Excel actualizado?', orden: 'Chat del proyecto', ordenIcon: MessageSquare, x: 16, y: 120, rot: 6 },
  { icon: FileSpreadsheet, iconColor: '#16a34a', caos: 'tareas_proyecto_FINAL2.xlsx', orden: 'Tablero de tareas', ordenIcon: ListChecks, x: 0, y: 210, rot: 4 },
  { icon: FileText, iconColor: '#f97316', caos: 'informe_sin_nombre (1).pdf', orden: 'Archivos del proyecto', ordenIcon: FolderOpen, x: 20, y: 290, rot: -5 },
  { icon: Mail, iconColor: '#ef4444', caos: '¿Quién estaba a cargo de esto?', orden: 'Responsables asignados', ordenIcon: UserCheck, x: 4, y: 370, rot: 9 },
];

// Destino ordenado: dentro del panel de la derecha.
const PANEL_X = 54;          // % del ancho donde empieza el panel
const FILA_Y0 = 96;          // px: primera fila dentro del panel
const FILA_ALTO = 64;        // px entre filas

export function PorQueExiste() {
  const ref = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  // El contenedor es más alto que la escena y la escena queda fija (sticky):
  // el progreso avanza mientras la escena está quieta en pantalla.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.18', 'end 0.72'] });
  const progreso = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });

  return (
    <section className="relative z-20 overflow-clip border-y border-border bg-[#05050A] py-24 md:py-32">
      {/* Fondo: foto de la Tierra de noche muy velada + resplandor */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('/images/landing/tierra-noche.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#05050A] via-[#05050A]/70 to-[#05050A]" />
      <div className="absolute left-1/2 top-1/3 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-[#05050A]/60 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Por qué existe</p>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tight leading-[1.05]">
            Las buenas ideas no deberían{' '}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent font-serif italic font-normal">perderse</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
            Hoy un proyecto se reparte entre correos, WhatsApp y hojas de cálculo, y quien podría resolverlo nunca se entera de que existe.
            En ProjectHub todo llega ordenado a un solo lugar.
          </p>
        </div>

        {/* ───── Escritorio: vuelo del caos al orden ───── */}
        {!reducir && (
          <div ref={ref} className="hidden lg:block relative h-[920px]">
            <div className="sticky top-[18vh] h-[460px]">
              <EtiquetasLado progreso={progreso} />
              <Panel progreso={progreso} />
              {PIEZAS.map((p, i) => (
                <PiezaVoladora key={p.caos} pieza={p} indice={i} progreso={progreso} />
              ))}
            </div>
          </div>
        )}

        {/* ───── Móvil / reducir movimiento: comparación estática ───── */}
        <div className={`${reducir ? '' : 'lg:hidden'} grid grid-cols-1 md:grid-cols-2 gap-6`}>
          <div className="rounded-3xl border border-red-400/20 bg-white/[0.03] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-red-300/80 mb-4">Hoy</p>
            <div className="space-y-2">
              {PIEZAS.map((p) => (
                <div key={p.caos} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-slate-300">
                  <p.icon className="w-4 h-4 flex-shrink-0" style={{ color: p.iconColor }} /> {p.caos}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-primary/40 bg-primary/10 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">Con ProjectHub</p>
            <div className="space-y-2">
              {PIEZAS.map((p) => (
                <div key={p.orden} className="flex items-center gap-3 rounded-xl bg-[#0B0F1E] border border-white/10 px-3 py-2.5 text-sm font-semibold text-white">
                  <p.ordenIcon className="w-4 h-4 text-blue-300 flex-shrink-0" /> {p.orden}
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Lado izquierdo: "Hoy" mientras hay caos; al final, el mensaje de cierre. */
function EtiquetasLado({ progreso }: { progreso: MotionValue<number> }) {
  const opHoy = useTransform(progreso, [0.1, 0.35], [1, 0]);
  const opFinal = useTransform(progreso, [0.75, 0.95], [0, 1]);
  const yFinal = useTransform(progreso, [0.75, 0.95], [20, 0]);
  return (
    <>
      <motion.p style={{ opacity: opHoy }} className="absolute left-0 -top-8 text-xs font-bold uppercase tracking-widest text-red-300/80">
        Hoy: todo disperso
      </motion.p>
      <motion.div style={{ opacity: opFinal, y: yFinal }} className="absolute left-0 top-1/2 -translate-y-1/2 w-[46%] pr-8">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300 mb-3">Con ProjectHub</p>
        <p className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
          De cinco lugares distintos a <span className="text-primary">un solo proyecto</span>.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Las propuestas, las conversaciones, las tareas, los archivos y los responsables quedan juntos y a la vista de todo el equipo.
        </p>
      </motion.div>
    </>
  );
}

/** Panel del proyecto en ProjectHub, a la derecha. Aparece a medida que llegan las piezas. */
function Panel({ progreso }: { progreso: MotionValue<number> }) {
  const opacidad = useTransform(progreso, [0.15, 0.6], [0.25, 1]);
  const escala = useTransform(progreso, [0.15, 0.6], [0.96, 1]);
  const brillo = useTransform(progreso, [0.6, 1], ['0 0 0 rgba(37,99,235,0)', '0 0 80px rgba(37,99,235,0.35)']);
  return (
    <motion.div
      style={{ opacity: opacidad, scale: escala, boxShadow: brillo, left: `${PANEL_X - 2}%` }}
      className="absolute top-0 right-0 h-full rounded-3xl border border-primary/40 bg-[#0B0F1E]/90 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-6 pt-5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-sm">P</div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-300">Con ProjectHub</p>
          <p className="text-white font-bold">Monitoreo de agua en comunidades rurales</p>
        </div>
      </div>
    </motion.div>
  );
}

function PiezaVoladora({ pieza: p, indice, progreso }: { pieza: Pieza; indice: number; progreso: MotionValue<number> }) {
  // Cada pieza arranca un poco después que la anterior.
  const ini = 0.05 + indice * 0.08;
  const fin = ini + 0.45;
  const t = useTransform(progreso, [ini, fin], [0, 1], { clamp: true });

  const left = useTransform(t, [0, 1], [`${p.x}%`, `${PANEL_X + 1}%`]);
  const top = useTransform(t, [0, 1], [p.y, FILA_Y0 + indice * FILA_ALTO]);
  const rotate = useTransform(t, [0, 1], [p.rot, 0]);
  const opCaos = useTransform(t, [0.4, 0.7], [1, 0]);
  const opOrden = useTransform(t, [0.5, 0.85], [0, 1]);
  const borde = useTransform(t, [0, 1], ['rgba(248,113,113,0.35)', 'rgba(96,165,250,0.35)']);

  return (
    <motion.div
      style={{ left, top, rotate, borderColor: borde }}
      className="absolute w-[40%] h-12 rounded-xl border bg-[#111629] shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
    >
      {/* Versión desordenada */}
      <motion.div style={{ opacity: opCaos }} className="absolute inset-0 flex items-center gap-3 px-4 text-sm text-slate-300">
        <p.icon className="w-4 h-4 flex-shrink-0" style={{ color: p.iconColor }} />
        <span className="truncate">{p.caos}</span>
      </motion.div>
      {/* Versión ordenada */}
      <motion.div style={{ opacity: opOrden }} className="absolute inset-0 flex items-center gap-3 px-4 text-sm font-semibold text-white">
        <p.ordenIcon className="w-4 h-4 flex-shrink-0 text-blue-300" />
        <span className="truncate">{p.orden}</span>
        <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
      </motion.div>
    </motion.div>
  );
}
