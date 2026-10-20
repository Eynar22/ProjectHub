/* ============================================================================
 * src/pages/inicio-nuevo/CaosOrden.tsx
 * "Las buenas ideas no deberían perderse" (por qué existe ProjectHub).
 * Motion graphics guiado por el scroll, en cuatro actos:
 *   1. Caos     — piezas sueltas (correos, WhatsApp, Excel, PDF) entran y
 *                 flotan temblando; un contador de "sin leer" no para de subir.
 *   2. Imán     — aparece la marca en el centro, las piezas se tensan hacia
 *                 ella y una onda guinda las recorre.
 *   3. Orden    — cada pieza vuela a su fila dentro del proyecto y se
 *                 convierte en su versión ordenada, con su check.
 *   4. Cierre   — los pendientes sin dueño bajan a 0 y se asientan con rebote.
 * Solo colores de la paleta oficial. Con reduced-motion se muestra el final.
 * ========================================================================= */

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2, FileSpreadsheet, FileText, FolderKanban, FolderOpen, ListChecks, Mail,
  MessageCircle, MessageSquare, UserCheck, type LucideIcon,
} from 'lucide-react';
import s from './CaosOrden.module.css';

interface Pieza {
  caos: string; iconoCaos: LucideIcon;
  orden: string; iconoOrden: LucideIcon;
  // Posición desordenada: fracción del ancho/alto de la mesa y giro.
  x: number; y: number; r: number;
}

const PIEZAS: Pieza[] = [
  { caos: 'RE: RE: FW: propuesta final (v3)', iconoCaos: Mail, orden: '3 propuestas recibidas', iconoOrden: FileText, x: 0.02, y: 0.06, r: -9 },
  { caos: '¿Alguien tiene el Excel actualizado?', iconoCaos: MessageCircle, orden: 'Chat del proyecto', iconoOrden: MessageSquare, x: 0.4, y: 0.24, r: 7 },
  { caos: 'tareas_proyecto_FINAL2.xlsx', iconoCaos: FileSpreadsheet, orden: 'Tablero de tareas', iconoOrden: ListChecks, x: 0.0, y: 0.46, r: 5 },
  { caos: 'informe_sin_nombre (1).pdf', iconoCaos: FileText, orden: 'Archivos del proyecto', iconoOrden: FolderOpen, x: 0.44, y: 0.64, r: -6 },
  { caos: '¿Quién estaba a cargo de esto?', iconoCaos: Mail, orden: 'Responsables asignados', iconoOrden: UserCheck, x: 0.08, y: 0.84, r: 10 },
];

const SIN_LEER_MAX = 47;
const PENDIENTES = 12;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const tramo = (p: number, desde: number, hasta: number) => clamp((p - desde) / (hasta - desde));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
// Rebote al asentarse (sobrepasa un poco y vuelve).
const easeBack = (t: number) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

export function CaosOrden() {
  const seccion = useRef<HTMLElement>(null);
  const mesa = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const iman = useRef<HTMLDivElement>(null);
  const onda = useRef<HTMLDivElement>(null);
  const sinLeer = useRef<HTMLDivElement>(null);
  const sinLeerNum = useRef<HTMLSpanElement>(null);
  const pie = useRef<HTMLDivElement>(null);
  const pieNum = useRef<HTMLSpanElement>(null);
  const piezas = useRef<(HTMLDivElement | null)[]>([]);
  const [ordenado, setOrdenado] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Referencias internas de cada pieza, resueltas una sola vez.
    const partes = piezas.current.map(el => el && {
      caja: el.firstElementChild as HTMLElement,
      caos: el.querySelector<HTMLElement>('[data-caos]')!,
      orden: el.querySelector<HTMLElement>('[data-orden]')!,
      iCaos: el.querySelector<HTMLElement>('[data-icaos]')!,
      iOrden: el.querySelector<HTMLElement>('[data-iorden]')!,
      check: el.querySelector<HTMLElement>('[data-check]')!,
    });
    let raf = 0;
    let previo = false;
    let yaVisible = false;

    const cuadro = (ms: number) => {
      const seg = ms / 1000;
      const r = seccion.current!.getBoundingClientRect();
      const p = reducir ? 1 : clamp(-r.top / (r.height - innerHeight));
      // Cuánto de la sección ya entró en pantalla antes de fijarse (0..1).
      const entrada = reducir ? 1 : clamp((innerHeight - r.top) / innerHeight);
      const W = mesa.current!.clientWidth, H = mesa.current!.clientHeight;
      if (!yaVisible && r.top < innerHeight * 0.6) { yaVisible = true; setVisible(true); }

      // ── Acto 1: contador de "sin leer" que no para de subir ──
      const caos = tramo(p, 0, 0.3);
      const vSin = Math.min(tramo(entrada, 0.55, 0.8), 1 - tramo(p, 0.3, 0.38));
      sinLeer.current!.style.opacity = String(vSin);
      sinLeer.current!.style.transform = `scale(${0.6 + 0.4 * easeBack(clamp(vSin))})`;
      sinLeerNum.current!.textContent = String(Math.round(8 + (SIN_LEER_MAX - 8) * caos));

      // ── Acto 2: la marca aparece como imán y suelta una onda ──
      const vIman = tramo(p, 0.27, 0.36) * (1 - tramo(p, 0.46, 0.54));
      const latido = 1 + Math.sin(seg * 6) * 0.04 * tramo(p, 0.27, 0.36);
      iman.current!.style.opacity = String(vIman);
      iman.current!.style.transform = `translate(-50%, -50%) scale(${(0.4 + 0.6 * easeBack(tramo(p, 0.27, 0.36))) * latido * (1 - 0.5 * tramo(p, 0.46, 0.54))})`;
      const o = tramo(p, 0.36, 0.5);
      onda.current!.style.opacity = String(o > 0 && o < 1 ? 1 - o : 0);
      onda.current!.style.transform = `translate(-50%, -50%) scale(${0.3 + easeOut(o) * 7})`;
      const tension = tramo(p, 0.26, 0.4); // las piezas se tensan hacia el centro

      // ── Acto 3: el proyecto se abre y cada pieza vuela a su fila ──
      const vp = easeOut(tramo(p, 0.42, 0.56));
      panel.current!.style.opacity = String(vp);
      panel.current!.style.transform = `scale(${0.92 + vp * 0.08})`;

      partes.forEach((pt, i) => {
        const el = piezas.current[i];
        if (!el || !pt) return;
        const pz = PIEZAS[i];
        // Entrada escalonada mientras la sección sube a la pantalla.
        const pop = easeBack(tramo(entrada, 0.35 + i * 0.09, 0.5 + i * 0.09));
        const t = easeIO(tramo(p, 0.46 + i * 0.045, 0.7 + i * 0.045));
        const libre = 1 - t;
        // Flotar: deriva suave; con la tensión, tiembla y se acerca al centro.
        const amp = 7 + tension * 5;
        const fx = Math.sin(seg * (0.8 + i * 0.13) + i * 1.7) * amp + Math.sin(seg * 23 + i) * tension * 2.5;
        const fy = Math.cos(seg * (0.9 + i * 0.11) + i * 2.3) * amp + Math.cos(seg * 19 + i) * tension * 2.5;
        const cx = pz.x + (0.3 - pz.x) * tension * 0.18;
        const cy = pz.y + (0.45 - pz.y) * tension * 0.18;
        const x = (cx + (0.1 - cx) * t) * W + fx * libre;
        const y = (cy + (0.2 + i * 0.14 - cy) * t) * H + fy * libre;
        const giro = (pz.r + Math.sin(seg * 1.3 + i) * 2) * libre;
        el.style.transform = `translate(${x}px, ${y}px) rotate(${giro}deg) scale(${pop})`;
        el.style.opacity = String(clamp(pop * 1.4));
        el.style.width = t > 0.5 ? `${W * 0.8}px` : '';
        el.style.zIndex = String(t > 0.5 ? 3 : 2);

        // A mitad del vuelo, la pieza se convierte en su versión ordenada.
        const listo = t > 0.6;
        pt.caos.style.opacity = listo ? '0' : '1';
        pt.caos.style.filter = listo ? 'blur(6px)' : 'none';
        pt.orden.style.opacity = listo ? '1' : '0';
        pt.orden.style.filter = listo ? 'none' : 'blur(6px)';
        pt.iCaos.style.opacity = listo ? '0' : '1';
        pt.iOrden.style.opacity = listo ? '1' : '0';
        pt.caja.style.background = listo ? 'var(--guinda-100)' : i % 2 === 0 ? 'var(--primary)' : 'var(--gray-600)';
        pt.caja.style.color = listo ? 'var(--guinda-600)' : 'var(--gray-50)';
        pt.check.style.opacity = listo ? '1' : '0';
        pt.check.style.transform = listo ? 'scale(1)' : 'scale(.4)';
      });

      // ── Acto 4: los pendientes sin dueño bajan a 0 y se asientan ──
      const vPie = tramo(p, 0.74, 0.8);
      const baja = easeOut(tramo(p, 0.78, 0.92));
      const asienta = tramo(p, 0.92, 0.98);
      pie.current!.style.opacity = String(vPie);
      pie.current!.style.transform = `translateY(${(1 - vPie) * 12}px) scale(${1 + Math.sin(asienta * Math.PI) * 0.08})`;
      pieNum.current!.textContent = String(Math.round(PENDIENTES * (1 - baja)));
      pie.current!.dataset.cero = String(baja >= 1);

      const ahora = p > 0.5;
      if (ahora !== previo) { previo = ahora; setOrdenado(ahora); }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(raf);
  }, []);

  const titulo = 'Las buenas ideas no deberían perderse.';

  return (
    <section ref={seccion} id="por-que" className={s.seccion}>
      <div className={s.escena}>
        <div>
          <p className={s.eyebrow}>Por qué existe</p>
          <h2 className={s.titulo}>
            {titulo.split(' ').map((w, i) => (
              <span key={i} className={s.w} style={{ color: w === 'perderse.' ? 'var(--primary)' : undefined, opacity: visible ? 1 : 0, filter: visible ? 'blur(0)' : 'blur(10px)', transition: `opacity .6s ${i * 0.06}s, filter .6s ${i * 0.06}s` }}>
                {w}{' '}
              </span>
            ))}
          </h2>
          <p className={s.texto}>
            Hoy un proyecto se reparte entre correos, WhatsApp y hojas de cálculo, y quien podría resolverlo nunca se entera de que existe.
            En ProjectHub todo llega ordenado a un solo lugar.
          </p>
          <div className={s.estado} aria-hidden="true">
            <span className={ordenado ? '' : s.on}>Hoy</span>
            <span className={ordenado ? s.on : ''}>Con ProjectHub</span>
          </div>
        </div>

        <div ref={mesa} className={s.mesa} aria-hidden="true">
          <div ref={panel} className={s.panel}>
            <div className={s.panelCab}><i /><b>Monitoreo de agua potable</b><small>ProjectHub</small></div>
            <div ref={pie} className={s.pie}>
              <CheckCircle2 size={18} />
              <span><span ref={pieNum}>{PENDIENTES}</span> pendientes sin dueño</span>
            </div>
          </div>

          <div ref={sinLeer} className={s.sinLeer}>
            <Mail size={16} /><span ref={sinLeerNum}>8</span> sin leer
          </div>

          <div ref={onda} className={s.onda} />
          <div ref={iman} className={s.iman}><FolderKanban /></div>

          {PIEZAS.map((pz, i) => (
            <div key={pz.caos} ref={el => { piezas.current[i] = el; }} className={s.pieza}>
              <span className={s.icono}>
                <pz.iconoCaos data-icaos />
                <pz.iconoOrden data-iorden style={{ opacity: 0 }} />
              </span>
              <span className={s.textos}>
                <span data-caos className={s.caos}>{pz.caos}</span>
                <span data-orden className={s.orden} style={{ opacity: 0 }}>{pz.orden}</span>
              </span>
              <CheckCircle2 data-check className={s.check} size={20} style={{ opacity: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
