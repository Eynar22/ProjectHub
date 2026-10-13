/* ============================================================================
 * src/pages/inicio-nuevo/Demo.tsx
 * "Todo el proyecto en un solo lugar" con el estilo de la portada nueva.
 *  - Las tres herramientas (tablero, chat, archivos) son un MAZO de ventanas:
 *    al bajar, la de adelante pasa al fondo y entra la siguiente (el gesto
 *    del mazo del hero). La ventana de adelante es jugable.
 *  - El scroll decide la herramienta; tocar una fila baja hasta ella.
 *  - Burbujas de actividad del equipo aparecen sobre la ventana.
 * Reutiliza las demos de shared/components/landing/TodoEnUnLugar.
 * Datos de ejemplo, no toca el backend.
 * ========================================================================= */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DemoArchivos, DemoChat, DemoTablero } from '@/shared/components/landing/TodoEnUnLugar';
import s from './Demo.module.css';

const HERRAMIENTAS = [
  {
    nombre: 'Tablero de tareas', Demo: DemoTablero, pista: 'Arrastra una tarea a otra columna',
    desc: 'Organiza el trabajo por columnas, asigna responsables, prioridades y fechas límite.',
    burbuja: { t: 'María movió una tarea a «Hecho»', color: 'var(--verde)', x: '72%', y: '-2%' },
  },
  {
    nombre: 'Chat del equipo', Demo: DemoChat, pista: 'Escribe un mensaje y envíalo',
    desc: 'Las conversaciones del proyecto quedan junto al trabajo, no dispersas en otras apps.',
    burbuja: { t: 'Nuevo mensaje de Juan', color: 'var(--azul)', x: '20%', y: '-2%' },
  },
  {
    nombre: 'Archivos y carpetas', Demo: DemoArchivos, pista: 'Abre una carpeta',
    desc: 'Documentos, PDFs e imágenes ordenados en carpetas, disponibles para todo el equipo.',
    burbuja: { t: 'informe.pdf subido', color: 'var(--rojo)', x: '68%', y: '-2%' },
  },
];
const N = HERRAMIENTAS.length;

export function Demo() {
  const seccion = useRef<HTMLElement>(null);
  const barras = useRef<(HTMLSpanElement | null)[]>([]);
  const [activa, setActiva] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reducir] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  // El avance del scroll elige la herramienta y llena la línea de la fila.
  useEffect(() => {
    let raf = 0;
    let previa = -1;
    const cuadro = () => {
      const r = seccion.current!.getBoundingClientRect();
      const p = Math.min(0.999, Math.max(0, -r.top / (r.height - innerHeight)));
      const i = Math.floor(p * N);
      if (i !== previa) { previa = i; setActiva(i); }
      barras.current.forEach((b, j) => { if (b) b.style.width = j === i ? `${(p * N - i) * 100}%` : '0'; });
      if (r.top < innerHeight * 0.5) setVisible(true);
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Tocar una fila baja hasta el tramo de esa herramienta.
  const irA = (i: number) => {
    const sec = seccion.current!;
    const total = sec.offsetHeight - innerHeight;
    const top = sec.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + total * ((i + 0.5) / N), behavior: reducir ? 'auto' : 'smooth' });
  };

  // Posición de cada ventana en el mazo según su distancia a la activa.
  const estiloVentana = (i: number): CSSProperties => {
    const d = (i - activa + N) % N; // 0 adelante, 1 y 2 detrás
    if (reducir) return { zIndex: N - d, opacity: d === 0 ? 1 : 0 };
    return {
      zIndex: N - d,
      transform: `translateY(${-d * 5}%) scale(${1 - d * 0.07})`,
      opacity: d === 0 ? 1 : 0.85 - d * 0.2,
    };
  };

  const titulo = 'Todo el proyecto en un solo lugar.';

  return (
    <section ref={seccion} id="demo" className={s.seccion}>
      <div className={s.escena}>
        <div>
          <p className={s.eyebrow}>Pruébalo aquí mismo</p>
          <h2 className={s.titulo}>
            {titulo.split(' ').map((w, i) => (
              <span key={i} className={s.w} style={{ opacity: visible || reducir ? 1 : 0, filter: visible || reducir ? 'blur(0)' : 'blur(10px)', transition: `opacity .6s ${i * 0.06}s, filter .6s ${i * 0.06}s` }}>
                {w}{' '}
              </span>
            ))}
          </h2>
          <p className={s.texto}>Cada proyecto tiene su grupo de trabajo. Juega con esta demo: así se trabaja dentro de ProjectHub.</p>

          <ul className={s.herramientas} role="tablist" aria-label="Herramientas del grupo de trabajo">
            {HERRAMIENTAS.map((h, i) => (
              <li key={h.nombre} className={`${s.herramienta} ${i === activa ? s.activa : ''}`}>
                <button type="button" role="tab" aria-selected={i === activa} className={s.boton} onClick={() => irA(i)}>
                  <span className={s.num}>0{i + 1}</span>
                  <span className={s.nombre}>{h.nombre}</span>
                  <span className={s.desc}>{h.desc}</span>
                </button>
                <span ref={el => { barras.current[i] = el; }} className={s.barra} aria-hidden="true" />
              </li>
            ))}
          </ul>
        </div>

        <div className={`${s.mazo} ${s.claro}`}>
          {HERRAMIENTAS.map((h, i) => {
            const adelante = i === activa;
            return (
              <div key={h.nombre} className={`${s.ventana} ${adelante ? '' : s.atras}`} style={estiloVentana(i)} aria-hidden={!adelante}>
                <div className={s.ventanaCab}>
                  <i /><i /><i />
                  <span>Monitoreo de agua · {h.nombre}</span>
                  <span className={s.pista}>{h.pista}</span>
                </div>
                <div className={s.cuerpo}><h.Demo /></div>
              </div>
            );
          })}

          {HERRAMIENTAS.map((h, i) => (
            <span
              key={h.burbuja.t}
              className={`${s.burbuja} ${i === activa && visible ? s.visible : ''}`}
              style={{ background: h.burbuja.color, left: h.burbuja.x, top: h.burbuja.y, transitionDelay: i === activa ? '.5s' : '0s' }}
              aria-hidden="true"
            >
              {h.burbuja.t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
