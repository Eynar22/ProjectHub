/* ============================================================================
 * src/shared/components/landing/HeroDemo.tsx
 * Demo animada del flujo de ProjectHub para el hero del landing:
 *   1. se publica un proyecto con su problema y sus ODS,
 *   2. llegan propuestas,
 *   3. se acepta una,
 *   4. el proyecto pasa al tablero del grupo de trabajo.
 * Usa el proyecto real más reciente si hay; si no, uno de ejemplo. Las
 * propuestas y tareas son ilustrativas (la tarjeta lo dice: "Así funciona").
 * Con prefers-reduced-motion se muestra el estado final, sin bucle.
 * ========================================================================= */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, FileText, MessageSquare, Paperclip, Sparkles } from 'lucide-react';
import type { Project } from '@/features/proyectos';
import { ODS_POR_ID } from '@/shared/constants/ods';
import { ProjectImage } from '@/shared/components/ui/ProjectImage';

const PROYECTO_EJEMPLO = {
  nombre: 'Monitoreo de agua en comunidades rurales',
  problema: 'Las comunidades no saben cuándo el agua deja de ser apta para el consumo.',
  ods: [6, 3, 11],
  imagenes: [] as Project['imagenes'],
  empresa: 'Empresa de ejemplo',
};

const PROPUESTAS = [
  { iniciales: 'MR', perfil: 'Ingeniera de software', resumen: 'Sensores de bajo costo con alertas por SMS.' },
  { iniciales: 'JC', perfil: 'Consultor ambiental', resumen: 'Protocolo de muestreo con la comunidad.' },
  { iniciales: 'AL', perfil: 'Equipo IoT', resumen: 'Red LoRa y panel web de calidad del agua.' },
];

const TAREAS = ['Instalar sensores piloto', 'Diseñar panel de alertas', 'Capacitar a la comunidad'];

// Fases del bucle y cuánto dura cada una (ms).
const FASES = [
  { id: 'publicado', ms: 2200 },
  { id: 'propuesta-1', ms: 1300 },
  { id: 'propuesta-2', ms: 1300 },
  { id: 'propuesta-3', ms: 1500 },
  { id: 'aceptada', ms: 2000 },
  { id: 'tablero', ms: 3600 },
] as const;

const FASE_FINAL = FASES.length - 1;

export function HeroDemo({ proyecto }: { proyecto?: Project }) {
  const reducir = useReducedMotion();
  const [fase, setFase] = useState(reducir ? FASE_FINAL : 0);

  useEffect(() => {
    if (reducir) return;
    const t = setTimeout(() => setFase((f) => (f + 1) % FASES.length), FASES[fase].ms);
    return () => clearTimeout(t);
  }, [fase, reducir]);

  const datos = proyecto
    ? {
        nombre: proyecto.nombre,
        problema: proyecto.problema || proyecto.descripcion_corta || '',
        ods: (proyecto.ods ?? []).slice(0, 3),
        imagenes: proyecto.imagenes,
        empresa: proyecto.creador?.empresa?.nombre ?? 'Empresa verificada',
      }
    : PROYECTO_EJEMPLO;

  const propuestasVisibles = fase >= 3 ? 3 : Math.max(0, fase);
  const aceptada = fase >= 4;
  const enTablero = fase === 5;

  const etiquetaPaso = ['Publicado', 'Recibiendo propuestas', 'Recibiendo propuestas', 'Recibiendo propuestas', 'Propuesta aceptada', 'Equipo trabajando'][fase];

  return (
    <div className="relative w-full max-w-md mx-auto" aria-hidden="true">
      {/* Resplandor detrás de la tarjeta */}
      <div className="absolute -inset-10 bg-primary/20 blur-[90px] rounded-full pointer-events-none" />

      <div className="relative rounded-3xl border border-white/15 bg-[#0B0F1E]/85 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Barra superior: indica que es una demostración y en qué paso va */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-blue-300">
            <Sparkles className="w-3.5 h-3.5" /> Así funciona
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={etiquetaPaso}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="text-[11px] font-semibold text-slate-300"
            >
              {etiquetaPaso}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Proyecto publicado */}
        <div className="p-5">
          <div className="flex gap-4">
            <ProjectImage imagenes={datos.imagenes} alt="" className="h-16 w-16 rounded-xl flex-shrink-0" fallback="dark" />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 font-medium truncate">{datos.empresa}</p>
              <p className="text-white font-bold leading-snug line-clamp-2">{datos.nombre}</p>
            </div>
          </div>
          {datos.problema && (
            <p className="mt-3 text-sm text-slate-300 leading-relaxed line-clamp-2">
              <span className="text-slate-400 font-semibold">Problema: </span>
              {datos.problema}
            </p>
          )}
          {datos.ods.length > 0 && (
            <div className="mt-3 flex gap-1.5">
              {datos.ods.map((id) => (
                <img key={id} src={`/images/ods/${id}.png`} alt="" title={ODS_POR_ID[id]?.nombre} className="w-8 h-8 rounded-md" />
              ))}
            </div>
          )}
        </div>

        {/* Zona inferior: propuestas o tablero */}
        <div className="px-5 pb-5 min-h-[196px]">
          <AnimatePresence mode="wait">
            {!enTablero ? (
              <motion.div key="propuestas" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Propuestas recibidas
                  <span className="ml-auto text-white bg-primary/80 rounded-full px-2 py-0.5 tabular-nums">{propuestasVisibles}</span>
                </p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {PROPUESTAS.slice(0, propuestasVisibles).map((p, i) => {
                      const esLaElegida = aceptada && i === 0;
                      const descartada = aceptada && i !== 0;
                      return (
                        <motion.div
                          key={p.iniciales}
                          initial={{ opacity: 0, x: 30, scale: 0.95 }}
                          animate={{ opacity: descartada ? 0.35 : 1, x: 0, scale: esLaElegida ? 1.02 : 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 border transition-colors ${
                            esLaElegida ? 'border-emerald-400/70 bg-emerald-400/10' : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/30 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {p.iniciales}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white">{p.perfil}</p>
                            <p className="text-[11px] text-slate-400 truncate">{p.resumen}</p>
                          </div>
                          {esLaElegida ? (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-300 flex items-center gap-1 text-[11px] font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Aceptada
                            </motion.span>
                          ) : (
                            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div key="tablero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  Grupo de trabajo
                  <span className="ml-auto flex items-center gap-1 normal-case tracking-normal font-medium text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5" /> 3 mensajes nuevos
                  </span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {['Por hacer', 'En proceso', 'Hecho'].map((col, ci) => (
                    <div key={col} className="rounded-xl bg-white/5 border border-white/10 p-2 min-h-[140px]">
                      <p className="text-[10px] font-bold text-slate-400 mb-2">{col}</p>
                      {TAREAS.map((t, ti) => {
                        // La primera tarea ya está en proceso; las demás, por hacer.
                        if ((ti === 0 ? 1 : 0) !== ci) return null;
                        return (
                          <motion.div
                            key={t}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 * ti + 0.2 }}
                            className="rounded-lg bg-[#131a33] border border-white/10 px-2 py-1.5 mb-1.5 text-[10px] leading-tight text-slate-200"
                          >
                            {t}
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progreso del bucle */}
        <div className="flex gap-1 px-5 pb-4">
          {FASES.map((f, i) => (
            <div key={f.id} className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
              {i === fase && !reducir ? (
                <motion.div
                  key={`activa-${fase}`}
                  className="h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: f.ms / 1000, ease: 'linear' }}
                />
              ) : (
                <div className="h-full bg-primary" style={{ width: i <= fase ? '100%' : '0%' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
