/* ============================================================================
 * src/shared/components/landing/ComoFunciona.tsx
 * Sección "Cómo funciona" del landing, contada con el scroll:
 *  - Escritorio: la sección es alta; a la izquierda los 3 pasos con una línea
 *    que se llena al bajar, y a la derecha una pantalla fija (sticky) que
 *    cambia con el paso activo y muestra una maqueta animada de la plataforma.
 *  - Móvil: los pasos van uno debajo del otro, cada uno con su maqueta.
 * Las maquetas son ilustrativas (datos de ejemplo), hechas con JSX: no
 * dependen de imágenes externas y se ven bien en tema claro y oscuro.
 * ========================================================================= */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'motion/react';
import {
  BadgeCheck, Building2, CheckCircle2, FileText, FolderUp, Lightbulb,
  MessageSquare, Rocket, Send, Upload, UserPlus,
} from 'lucide-react';

const PASOS = [
  {
    icon: UserPlus,
    titulo: 'Crea tu cuenta',
    texto: 'Registra tu empresa con su documentación o entra como profesional independiente. Revisamos cada empresa antes de activarla.',
    detalle: ['Empresa, empleado o independiente', 'Documentos verificados', 'Aprobación del equipo de ProjectHub'],
  },
  {
    icon: FolderUp,
    titulo: 'Publica o postula',
    texto: 'La empresa publica el proyecto con el problema a resolver, fechas y ODS. Los interesados envían su propuesta y la empresa elige.',
    detalle: ['Problema, fechas y financiamiento', 'ODS a los que aporta', 'Propuestas con CV adjunto'],
  },
  {
    icon: Rocket,
    titulo: 'Trabajen juntos',
    texto: 'Al ser aceptado entras al grupo de trabajo del proyecto: tareas, chat y archivos del equipo en un solo lugar.',
    detalle: ['Tablero de tareas', 'Chat del proyecto', 'Archivos y carpetas'],
  },
] as const;

export function ComoFunciona() {
  const ref = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  const [activo, setActivo] = useState(0);

  // 0 → 1 mientras la sección recorre la pantalla.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 60%', 'end 70%'] });
  const progreso = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActivo(Math.min(PASOS.length - 1, Math.max(0, Math.floor(v * PASOS.length))));
  });

  return (
    <section id="como-funciona" className="scroll-mt-16 relative z-20 py-24 bg-muted/30 border-b border-border/50">
      {/* Resplandores de fondo */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 left-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Paso a paso</p>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">Cómo funciona</h2>
          <p className="text-lg text-muted-foreground">De la idea al equipo trabajando, en tres pasos.</p>
        </div>

        {/* ───── Escritorio: pasos + pantalla fija ───── */}
        <div ref={ref} className="hidden lg:grid grid-cols-2 gap-16">
          <div className="relative">
            {/* Línea de progreso */}
            <div className="absolute left-7 top-4 bottom-4 w-[3px] rounded-full bg-border" />
            <motion.div
              className="absolute left-7 top-4 bottom-4 w-[3px] rounded-full bg-gradient-to-b from-primary to-indigo-400 origin-top"
              style={{ scaleY: reducir ? 1 : progreso }}
            />

            {PASOS.map((p, i) => {
              const esActivo = i === activo;
              const hecho = i < activo;
              return (
                <div key={p.titulo} className="relative min-h-[70vh] flex items-center">
                  <div className="flex gap-8 items-start">
                    <motion.div
                      animate={{ scale: esActivo ? 1.1 : 1 }}
                      className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 transition-colors duration-500 ${
                        esActivo || hecho
                          ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_30px_rgba(37,99,235,0.45)]'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {hecho ? <CheckCircle2 className="w-6 h-6" /> : <p.icon className="w-6 h-6" />}
                    </motion.div>
                    <motion.div animate={{ opacity: esActivo ? 1 : 0.4, x: esActivo ? 0 : -6 }} transition={{ duration: 0.4 }}>
                      <p className="text-sm font-bold text-primary mb-1">Paso {i + 1}</p>
                      <h3 className="text-3xl font-extrabold font-serif mb-3">{p.titulo}</h3>
                      <p className="text-muted-foreground leading-relaxed max-w-md mb-4">{p.texto}</p>
                      <ul className="space-y-2">
                        {p.detalle.map((d) => (
                          <li key={d} className="flex items-center gap-2 text-sm text-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> {d}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative">
            <div className="sticky top-28 h-[calc(100vh-10rem)] max-h-[560px] flex items-center">
              <Pantalla paso={activo} />
            </div>
          </div>
        </div>

        {/* ───── Móvil: uno debajo del otro ───── */}
        <div className="lg:hidden space-y-16">
          {PASOS.map((p, i) => (
            <div key={p.titulo}>
              <div className="flex gap-4 items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">Paso {i + 1}</p>
                  <h3 className="text-2xl font-extrabold font-serif mb-2">{p.titulo}</h3>
                  <p className="text-muted-foreground leading-relaxed">{p.texto}</p>
                </div>
              </div>
              <Pantalla paso={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── Pantalla con la maqueta del paso ──────────────── */

const RUTAS = ['projecthub.bo/registro', 'projecthub.bo/proyecto/nuevo', 'projecthub.bo/grupo-trabajo'];

function Pantalla({ paso }: { paso: number }) {
  return (
    <div className="w-full rounded-3xl border border-border/70 bg-card shadow-[0_30px_80px_rgba(0,0,0,0.25)] overflow-hidden" aria-hidden="true">
      {/* Barra de navegador */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/40">
        <span className="w-3 h-3 rounded-full bg-red-400/80" />
        <span className="w-3 h-3 rounded-full bg-amber-400/80" />
        <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
        <div className="ml-3 flex-1 rounded-full bg-background/70 border border-border/60 px-3 py-1 text-[11px] text-muted-foreground truncate">
          {RUTAS[paso]}
        </div>
      </div>
      <div className="relative p-6 min-h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={paso}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.98 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {paso === 0 && <MaquetaRegistro />}
            {paso === 1 && <MaquetaProyecto />}
            {paso === 2 && <MaquetaTablero />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Aparición escalonada de los elementos de cada maqueta.
const aparecer = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.15 + i * 0.18, duration: 0.4 },
});

function Campo({ etiqueta, valor, i }: { etiqueta: string; valor: string; i: number }) {
  return (
    <motion.div {...aparecer(i)}>
      <p className="text-[11px] font-semibold text-muted-foreground mb-1">{etiqueta}</p>
      <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">{valor}</div>
    </motion.div>
  );
}

function MaquetaRegistro() {
  return (
    <div>
      <motion.div {...aparecer(0)} className="flex gap-2 mb-5">
        {[
          { icon: Building2, t: 'Empresa', on: true },
          { icon: Lightbulb, t: 'Independiente', on: false },
        ].map((o) => (
          <div key={o.t} className={`flex-1 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${o.on ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
            <o.icon className="w-4 h-4" /> {o.t}
          </div>
        ))}
      </motion.div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Campo i={1} etiqueta="Nombre de la empresa" valor="AguaViva S.R.L." />
        <Campo i={2} etiqueta="Número de empleados" valor="45" />
      </div>
      <Campo i={3} etiqueta="Descripción" valor="Soluciones de agua potable para municipios." />
      <motion.div {...aparecer(4)} className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-3">
        <Upload className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground flex-1">matricula-comercio.pdf</span>
        <FileText className="w-4 h-4 text-muted-foreground" />
      </motion.div>
      {/* El estado pasa de "en revisión" a "aprobada" */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-5 flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3"
      >
        <span className="text-sm font-semibold text-foreground">Estado de la cuenta</span>
        <motion.span
          initial={{ backgroundColor: 'rgba(245,158,11,0.15)', color: 'rgb(217,119,6)' }}
          animate={{ backgroundColor: 'rgba(16,185,129,0.15)', color: 'rgb(5,150,105)' }}
          transition={{ delay: 2.2, duration: 0.5 }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
        >
          <BadgeCheck className="w-4 h-4" />
          <EstadoCambiante />
        </motion.span>
      </motion.div>
    </div>
  );
}

function EstadoCambiante() {
  const [aprobada, setAprobada] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAprobada(true), 2200);
    return () => clearTimeout(t);
  }, []);
  return <span>{aprobada ? 'Aprobada' : 'En revisión'}</span>;
}

function MaquetaProyecto() {
  const propuestas = [
    { ini: 'MR', perfil: 'Ingeniera de software' },
    { ini: 'JC', perfil: 'Consultor ambiental' },
  ];
  return (
    <div>
      <motion.p {...aparecer(0)} className="text-lg font-extrabold text-foreground mb-1">
        Monitoreo de agua en comunidades rurales
      </motion.p>
      <motion.p {...aparecer(1)} className="text-sm text-muted-foreground mb-4">
        <span className="font-semibold text-foreground">Problema: </span>
        las comunidades no saben cuándo el agua deja de ser apta para el consumo.
      </motion.p>
      <motion.div {...aparecer(2)} className="flex flex-wrap items-center gap-2 mb-5">
        {[6, 3, 11].map((id) => (
          <img key={id} src={`/images/ods/${id}.png`} alt="" className="w-10 h-10 rounded-lg" />
        ))}
        <span className="ml-auto text-xs font-semibold rounded-full bg-muted px-3 py-1 text-muted-foreground">Cierra: 30 nov</span>
      </motion.div>
      <motion.p {...aparecer(3)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
        Propuestas recibidas
      </motion.p>
      <div className="space-y-2">
        {propuestas.map((p, i) => (
          <motion.div
            key={p.ini}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.45, type: 'spring', stiffness: 220, damping: 20 }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${i === 0 ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-border'}`}
          >
            <div className="w-9 h-9 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{p.ini}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{p.perfil}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> propuesta.pdf · CV</p>
            </div>
            {i === 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.1, type: 'spring' }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Aceptada
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MaquetaTablero() {
  const columnas = [
    { t: 'Por hacer', tareas: ['Capacitar a la comunidad'] },
    { t: 'En proceso', tareas: ['Diseñar panel de alertas'] },
    { t: 'Hecho', tareas: [] as string[] },
  ];
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {columnas.map((c, ci) => (
          <motion.div key={c.t} {...aparecer(ci)} className="rounded-xl bg-muted/50 border border-border/60 p-2.5 min-h-[150px]">
            <p className="text-xs font-bold text-muted-foreground mb-2">{c.t}</p>
            {c.tareas.map((t) => (
              <div key={t} className="rounded-lg bg-card border border-border px-2.5 py-2 mb-2 text-xs text-foreground shadow-sm">{t}</div>
            ))}
            {/* Esta tarea "se mueve" de En proceso a Hecho */}
            {ci === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -90 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, type: 'spring', stiffness: 160, damping: 18 }}
                className="rounded-lg bg-card border border-emerald-500/50 px-2.5 py-2 text-xs text-foreground shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Instalar sensores piloto
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      <motion.div {...aparecer(3)} className="rounded-xl border border-border/60 p-3">
        <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> Chat del proyecto
        </p>
        <div className="space-y-2">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
            className="max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-xs text-foreground">
            ¡Los sensores del piloto ya están enviando datos!
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.3 }}
            className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground flex items-center gap-1.5">
            Excelente, subo el informe a Archivos <Send className="w-3 h-3" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
