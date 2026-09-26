/* ============================================================================
 * src/shared/components/landing/TodoEnUnLugar.tsx
 * Sección "Todo el proyecto en un solo lugar" del landing: demo jugable del
 * grupo de trabajo. Se elige la herramienta a la izquierda y a la derecha se
 * puede usar una versión de juguete:
 *   - Tablero: arrastrar tareas entre columnas.
 *   - Chat: escribir y enviar un mensaje; el equipo "responde".
 *   - Archivos: abrir carpetas y ver sus documentos.
 * Las pestañas rotan solas hasta que el usuario interactúa. Todo es local
 * (datos de ejemplo), no toca el backend.
 * ========================================================================= */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChevronRight, FileImage, FileText, Folder, FolderOpen, GripVertical, Hand,
  ListChecks, MessageSquare, Send, type LucideIcon,
} from 'lucide-react';
import { Reveal } from '@/shared/components/Reveal';

type Herramienta = 'tablero' | 'chat' | 'archivos';

const HERRAMIENTAS: { id: Herramienta; icon: LucideIcon; titulo: string; texto: string; pista: string }[] = [
  { id: 'tablero', icon: ListChecks, titulo: 'Tablero de tareas', texto: 'Organiza el trabajo por columnas, asigna responsables, define prioridades y fechas límite.', pista: 'Arrastra una tarea a otra columna' },
  { id: 'chat', icon: MessageSquare, titulo: 'Chat del equipo', texto: 'Las conversaciones del proyecto quedan junto al trabajo, no dispersas en otras apps.', pista: 'Escribe un mensaje y envíalo' },
  { id: 'archivos', icon: FolderOpen, titulo: 'Archivos y carpetas', texto: 'Documentos, PDFs e imágenes ordenados en carpetas y disponibles para todo el equipo.', pista: 'Abre una carpeta' },
];

const ROTAR_MS = 7000;

export function TodoEnUnLugar() {
  const reducir = useReducedMotion();
  const [activa, setActiva] = useState<Herramienta>('tablero');
  const [autoRotar, setAutoRotar] = useState(!reducir);

  useEffect(() => {
    if (!autoRotar) return;
    const t = setTimeout(() => {
      const i = HERRAMIENTAS.findIndex((h) => h.id === activa);
      setActiva(HERRAMIENTAS[(i + 1) % HERRAMIENTAS.length].id);
    }, ROTAR_MS);
    return () => clearTimeout(t);
  }, [activa, autoRotar]);

  // Al primer toque del usuario dejamos de rotar: está explorando.
  const detener = () => setAutoRotar(false);
  const actual = HERRAMIENTAS.find((h) => h.id === activa)!;

  return (
    <section id="demo" className="scroll-mt-16 relative z-20 py-24 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-14 max-w-3xl mx-auto">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Pruébalo aquí mismo</p>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">Todo el proyecto en un solo lugar</h2>
          <p className="text-lg text-muted-foreground">
            Cada proyecto tiene su grupo de trabajo. Juega con esta demo: así se trabaja dentro de ProjectHub.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 items-start">
          {/* Selector de herramienta */}
          <div className="grid gap-3" role="tablist" aria-label="Herramientas del grupo de trabajo">
            {HERRAMIENTAS.map((h) => {
              const on = h.id === activa;
              return (
                <button
                  key={h.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => { setActiva(h.id); detener(); }}
                  className={`relative text-left rounded-2xl border p-5 overflow-hidden transition-all duration-300 ${
                    on ? 'bg-card border-primary/50 shadow-lg' : 'bg-card/40 border-border/60 hover:bg-card/70'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${on ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                      <h.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{h.titulo}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{h.texto}</p>
                    </div>
                  </div>
                  {/* Barra de tiempo de la rotación automática */}
                  {on && autoRotar && (
                    <motion.div
                      key={`barra-${h.id}`}
                      className="absolute left-0 bottom-0 h-[3px] bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: ROTAR_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Demo */}
          <div
            onPointerDown={detener}
            onKeyDown={detener}
            className="rounded-3xl border border-border/70 bg-card shadow-[0_30px_80px_rgba(0,0,0,0.25)] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/40">
              <span className="w-3 h-3 rounded-full bg-red-400/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 text-xs font-semibold text-muted-foreground truncate">Monitoreo de agua · Grupo de trabajo</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-primary">
                <Hand className="w-3.5 h-3.5" /> {actual.pista}
              </span>
            </div>
            <div className="p-5 h-[380px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activa}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {activa === 'tablero' && <DemoTablero />}
                  {activa === 'chat' && <DemoChat />}
                  {activa === 'archivos' && <DemoArchivos />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Tablero: arrastrar tareas entre columnas ─────────────── */

const COLUMNAS = ['Por hacer', 'En proceso', 'Hecho'];
const PRIORIDAD_COLOR = { alta: 'bg-red-500', media: 'bg-amber-500', baja: 'bg-emerald-500' } as const;

interface TareaDemo { id: number; titulo: string; col: number; prioridad: keyof typeof PRIORIDAD_COLOR; quien: string }

const TAREAS_INICIALES: TareaDemo[] = [
  { id: 1, titulo: 'Capacitar a la comunidad', col: 0, prioridad: 'media', quien: 'JC' },
  { id: 2, titulo: 'Comprar sensores', col: 0, prioridad: 'alta', quien: 'AL' },
  { id: 3, titulo: 'Diseñar panel de alertas', col: 1, prioridad: 'alta', quien: 'MR' },
  { id: 4, titulo: 'Definir puntos de muestreo', col: 2, prioridad: 'baja', quien: 'JC' },
];

// Posición del puntero en la ventana (mouse o toque), para compararla con getBoundingClientRect.
function coords(e: MouseEvent | TouchEvent | PointerEvent): [number, number] {
  const p = 'changedTouches' in e ? e.changedTouches[0] : e;
  return [p.clientX, p.clientY];
}

function DemoTablero() {
  const [tareas, setTareas] = useState(TAREAS_INICIALES);
  const [sobre, setSobre] = useState<number | null>(null);
  const colsRef = useRef<(HTMLDivElement | null)[]>([]);

  const columnaEn = (x: number, y: number) =>
    colsRef.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });

  return (
    <div className="grid grid-cols-3 gap-3 h-full">
      {COLUMNAS.map((nombre, ci) => {
        const lista = tareas.filter((t) => t.col === ci);
        return (
          <div
            key={nombre}
            ref={(el) => { colsRef.current[ci] = el; }}
            className={`rounded-2xl border p-2.5 transition-colors duration-200 ${
              sobre === ci ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/40'
            }`}
          >
            <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center justify-between px-1">
              {nombre} <span className="rounded-full bg-background px-2 py-0.5 tabular-nums">{lista.length}</span>
            </p>
            <div className="space-y-2">
              {lista.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  drag
                  dragSnapToOrigin
                  whileDrag={{ scale: 1.06, rotate: 2, zIndex: 50, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                  onDrag={(e) => setSobre(columnaEn(...coords(e)))}
                  onDragEnd={(e) => {
                    const destino = columnaEn(...coords(e));
                    setSobre(null);
                    if (destino >= 0 && destino !== t.col) {
                      setTareas((prev) => prev.map((x) => (x.id === t.id ? { ...x, col: destino } : x)));
                    }
                  }}
                  className={`relative rounded-xl border bg-card px-2.5 py-2 cursor-grab active:cursor-grabbing select-none touch-none ${
                    t.col === 2 ? 'border-emerald-500/40' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <GripVertical className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <p className={`text-xs font-medium leading-snug ${t.col === 2 ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.titulo}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pl-5">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
                      <span className={`w-1.5 h-1.5 rounded-full ${PRIORIDAD_COLOR[t.prioridad]}`} /> {t.prioridad}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center">{t.quien}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────── Chat: escribir y recibir respuesta ─────────────── */

interface MensajeDemo { id: number; yo: boolean; quien?: string; texto: string }

const RESPUESTAS = [
  '¡Perfecto! Lo anoto en el tablero 👍',
  'Buenísimo, lo reviso esta tarde.',
  'Gracias, ya lo vi. Subo el informe a Archivos.',
];

function DemoChat() {
  const [mensajes, setMensajes] = useState<MensajeDemo[]>([
    { id: 1, yo: false, quien: 'MR', texto: 'Los sensores del piloto ya están enviando datos 🎉' },
    { id: 2, yo: false, quien: 'JC', texto: '¿Agendamos la capacitación para el jueves?' },
  ]);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(3);
  const respRef = useRef(0);

  useEffect(() => {
    // Solo se desplaza la caja del chat, nunca la página.
    const caja = cajaRef.current;
    if (caja) caja.scrollTo({ top: caja.scrollHeight, behavior: 'smooth' });
  }, [mensajes, escribiendo]);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || escribiendo) return;
    setMensajes((m) => [...m, { id: idRef.current++, yo: true, texto: limpio.slice(0, 120) }]);
    setTexto('');
    setEscribiendo(true);
    setTimeout(() => {
      setEscribiendo(false);
      setMensajes((m) => [...m, { id: idRef.current++, yo: false, quien: 'MR', texto: RESPUESTAS[respRef.current++ % RESPUESTAS.length] }]);
    }, 1400);
  };

  return (
    <div className="h-full flex flex-col">
      <div ref={cajaRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        <AnimatePresence initial={false}>
          {mensajes.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex items-end gap-2 ${m.yo ? 'justify-end' : ''}`}
            >
              {!m.yo && (
                <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">{m.quien}</span>
              )}
              <p className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                m.yo ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                {m.texto}
              </p>
            </motion.div>
          ))}
          {escribiendo && (
            <motion.div key="escribiendo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">MR</span>
              <span className="flex gap-1 rounded-2xl bg-muted px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <form onSubmit={enviar} className="mt-3 flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={120}
          placeholder="Escribe un mensaje al equipo…"
          aria-label="Mensaje de prueba"
          className="flex-1 min-h-11 rounded-xl border border-input bg-input-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        <button type="submit" disabled={!texto.trim() || escribiendo} aria-label="Enviar"
          className="min-h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

/* ─────────────── Archivos: abrir carpetas ─────────────── */

const CARPETAS: { nombre: string; archivos: { nombre: string; tipo: 'pdf' | 'img'; peso: string }[] }[] = [
  { nombre: 'Propuestas', archivos: [
    { nombre: 'propuesta-sensores-lora.pdf', tipo: 'pdf', peso: '1,2 MB' },
    { nombre: 'propuesta-muestreo.pdf', tipo: 'pdf', peso: '860 KB' },
  ] },
  { nombre: 'Informes', archivos: [
    { nombre: 'informe-piloto-semana-1.pdf', tipo: 'pdf', peso: '2,4 MB' },
    { nombre: 'resultados-calidad-agua.pdf', tipo: 'pdf', peso: '1,1 MB' },
  ] },
  { nombre: 'Fotos de campo', archivos: [
    { nombre: 'instalacion-sensor-01.jpg', tipo: 'img', peso: '3,1 MB' },
    { nombre: 'pozo-comunidad.jpg', tipo: 'img', peso: '2,7 MB' },
    { nombre: 'capacitacion.jpg', tipo: 'img', peso: '2,2 MB' },
  ] },
];

function DemoArchivos() {
  const [abierta, setAbierta] = useState<number | null>(null);
  const carpeta = abierta === null ? null : CARPETAS[abierta];

  return (
    <div className="h-full flex flex-col">
      {/* Ruta */}
      <div className="flex items-center gap-1 text-sm mb-4">
        <button onClick={() => setAbierta(null)} className={`font-semibold hover:underline ${carpeta ? 'text-primary' : 'text-foreground'}`}>
          Archivos del proyecto
        </button>
        {carpeta && (
          <>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">{carpeta.nombre}</span>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!carpeta ? (
          <motion.div key="raiz" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-3 gap-3">
            {CARPETAS.map((c, i) => (
              <motion.button
                key={c.nombre}
                onClick={() => setAbierta(i)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                className="group rounded-2xl border border-border/70 bg-muted/30 hover:bg-primary/5 hover:border-primary/40 p-4 text-left transition-colors"
              >
                <Folder className="w-10 h-10 text-amber-500 mb-3 group-hover:hidden" />
                <FolderOpen className="w-10 h-10 text-amber-500 mb-3 hidden group-hover:block" />
                <p className="text-sm font-semibold text-foreground">{c.nombre}</p>
                <p className="text-xs text-muted-foreground">{c.archivos.length} archivos</p>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div key={carpeta.nombre} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="space-y-2">
            {carpeta.archivos.map((a, i) => (
              <motion.div
                key={a.nombre}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                {a.tipo === 'pdf'
                  ? <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                  : <FileImage className="w-5 h-5 text-sky-500 flex-shrink-0" />}
                <span className="text-sm text-foreground flex-1 truncate">{a.nombre}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{a.peso}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
