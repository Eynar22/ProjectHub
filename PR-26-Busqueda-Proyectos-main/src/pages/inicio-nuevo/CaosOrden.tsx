/* ============================================================================
 * src/pages/inicio-nuevo/CaosOrden.tsx
 * "Las buenas ideas no deberían perderse" (por qué existe ProjectHub), en el
 * estilo de la portada nueva. Al bajar, piezas sueltas (correos, WhatsApp,
 * Excel, PDF) que flotan desordenadas vuelan y se acomodan dentro de un
 * proyecto de ProjectHub, y cada una se convierte en su versión ordenada.
 * Es el mismo gesto del mazo del hero: lo disperso se junta.
 * ========================================================================= */

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2, FileSpreadsheet, FileText, FolderOpen, ListChecks, Mail,
  MessageCircle, MessageSquare, UserCheck, type LucideIcon,
} from 'lucide-react';
import s from './CaosOrden.module.css';

interface Pieza {
  caos: string; iconoCaos: LucideIcon; colorCaos: string;
  orden: string; iconoOrden: LucideIcon;
  // Posición desordenada: fracción del ancho/alto de la mesa y giro.
  x: number; y: number; r: number;
}

const PIEZAS: Pieza[] = [
  { caos: 'RE: RE: FW: propuesta final (v3)', iconoCaos: Mail, colorCaos: '#E5484D', orden: '3 propuestas recibidas', iconoOrden: FileText, x: 0.02, y: 0.08, r: -9 },
  { caos: '¿Alguien tiene el Excel actualizado?', iconoCaos: MessageCircle, colorCaos: '#25A35A', orden: 'Chat del proyecto', iconoOrden: MessageSquare, x: 0.38, y: 0.26, r: 7 },
  { caos: 'tareas_proyecto_FINAL2.xlsx', iconoCaos: FileSpreadsheet, colorCaos: '#1D7A46', orden: 'Tablero de tareas', iconoOrden: ListChecks, x: 0.0, y: 0.47, r: 5 },
  { caos: 'informe_sin_nombre (1).pdf', iconoCaos: FileText, colorCaos: '#E8742A', orden: 'Archivos del proyecto', iconoOrden: FolderOpen, x: 0.42, y: 0.64, r: -6 },
  { caos: '¿Quién estaba a cargo de esto?', iconoCaos: Mail, colorCaos: '#E5484D', orden: 'Responsables asignados', iconoOrden: UserCheck, x: 0.08, y: 0.84, r: 10 },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function CaosOrden() {
  const seccion = useRef<HTMLElement>(null);
  const mesa = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const piezas = useRef<(HTMLDivElement | null)[]>([]);
  const [ordenado, setOrdenado] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let previo = false;
    const cuadro = () => {
      const r = seccion.current!.getBoundingClientRect();
      const p = reducir ? 1 : clamp(-r.top / (r.height - innerHeight));
      const W = mesa.current!.clientWidth, H = mesa.current!.clientHeight;
      if (r.top < innerHeight * 0.6 && !visible) setVisible(true);

      // El panel aparece mientras llegan las piezas.
      const vp = clamp((p - 0.08) / 0.25);
      panel.current!.style.opacity = String(vp);
      panel.current!.style.transform = `scale(${0.95 + vp * 0.05})`;

      piezas.current.forEach((el, i) => {
        if (!el) return;
        const pz = PIEZAS[i];
        const t = easeIO(clamp((p - 0.12 - i * 0.07) / 0.38));
        const x = (pz.x + (0.12 - pz.x) * t) * W;
        const y = (pz.y + (0.2 + i * 0.145 - pz.y) * t) * H;
        el.style.transform = `translate(${x}px, ${y}px) rotate(${pz.r * (1 - t)}deg)`;
        el.style.width = t > 0.5 ? `${W * 0.76}px` : '';
        // A mitad de camino, la pieza se convierte en su versión ordenada.
        const listo = t > 0.6;
        el.dataset.listo = String(listo);
        const [caos, orden, iCaos, iOrden, check] = [
          el.querySelector<HTMLElement>('[data-caos]'), el.querySelector<HTMLElement>('[data-orden]'),
          el.querySelector<HTMLElement>('[data-icaos]'), el.querySelector<HTMLElement>('[data-iorden]'),
          el.querySelector<HTMLElement>('[data-check]'),
        ];
        caos!.style.opacity = listo ? '0' : '1';
        caos!.style.filter = listo ? 'blur(6px)' : 'none';
        orden!.style.opacity = listo ? '1' : '0';
        orden!.style.filter = listo ? 'none' : 'blur(6px)';
        iCaos!.style.opacity = listo ? '0' : '1';
        iOrden!.style.opacity = listo ? '1' : '0';
        (el.firstElementChild as HTMLElement).style.background = listo ? 'var(--tinta)' : pz.colorCaos;
        (el.firstElementChild as HTMLElement).style.color = listo ? 'var(--sobre-tinta)' : '#fff';
        check!.style.opacity = listo ? '1' : '0';
        check!.style.transform = listo ? 'scale(1)' : 'scale(.4)';
      });

      const ahora = p > 0.45;
      if (ahora !== previo) { previo = ahora; setOrdenado(ahora); }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  const titulo = 'Las buenas ideas no deberían perderse.';

  return (
    <section ref={seccion} id="por-que" className={s.seccion}>
      <div className={s.escena}>
        <div>
          <p className={s.eyebrow}>Por qué existe</p>
          <h2 className={s.titulo}>
            {titulo.split(' ').map((w, i) => (
              <span key={i} className={s.w} style={{ opacity: visible ? 1 : 0, filter: visible ? 'blur(0)' : 'blur(10px)', transition: `opacity .6s ${i * 0.06}s, filter .6s ${i * 0.06}s` }}>
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
          </div>
          {PIEZAS.map((pz, i) => (
            <div key={pz.caos} ref={el => { piezas.current[i] = el; }} className={s.pieza}>
              <span className={s.icono} style={{ background: pz.colorCaos, color: '#fff' }}>
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
