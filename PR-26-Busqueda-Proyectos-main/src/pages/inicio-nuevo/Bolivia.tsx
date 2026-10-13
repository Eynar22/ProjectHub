/* ============================================================================
 * src/pages/inicio-nuevo/Bolivia.tsx
 * Banda oscura "Hecho en Bolivia": cambia de capítulo antes del cierre.
 *  - La frase se ilumina palabra por palabra según el scroll.
 *  - Debajo, una fila de fotos de Bolivia que se desliza hacia la izquierda
 *    al bajar.
 * Fotos: Unsplash (public/images/landing/).
 * ========================================================================= */

import { useEffect, useRef } from 'react';
import s from './Bolivia.module.css';

const FRASE = 'Bolivia tiene problemas reales, y gente capaz de resolverlos.';
const DESTACADAS = new Set(['gente', 'capaz', 'resolverlos.']);
const FOTOS = ['bolivia-illimani', 'bolivia-mercado', 'bolivia-teleferico', 'bolivia-murales', 'bolivia-salar', 'equipos'];

export function Bolivia() {
  const seccion = useRef<HTMLElement>(null);
  const frase = useRef<HTMLHeadingElement>(null);
  const fila = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const palabras = [...frase.current!.querySelectorAll<HTMLElement>('[data-w]')];
    if (reducir) { palabras.forEach(w => { w.style.opacity = '1'; }); return; }

    let raf = 0;
    const cuadro = () => {
      const r = seccion.current!.getBoundingClientRect();
      // 0 cuando la sección asoma abajo, 1 cuando su final llega arriba.
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight)));
      // La frase se ilumina en el primer tramo.
      const luz = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.9)));
      palabras.forEach((w, i) => {
        const t = Math.min(1, Math.max(0, luz * palabras.length - i));
        w.style.opacity = String(0.18 + t * 0.82);
      });
      // La fila se desplaza hasta un 35% de su ancho.
      fila.current!.style.transform = `translateX(${-p * fila.current!.scrollWidth * 0.35}px)`;
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={seccion} className={s.seccion}>
      <div className={s.dentro}>
        <p className={s.eyebrow}>Hecho en Bolivia</p>
        <h2 ref={frase} className={s.frase}>
          {FRASE.split(' ').map((w, i) => (
            <span key={i} data-w className={`${s.w} ${DESTACADAS.has(w) ? s.acento : ''}`} style={{ opacity: 0.18 }}>{w} </span>
          ))}
        </h2>
      </div>

      <div ref={fila} className={s.fila} aria-hidden="true">
        {FOTOS.map((f, i) => (
          <div key={f} className={s.foto}>
            {i === 0 && <span className={s.burbuja}>Hecho en Bolivia</span>}
            <img src={`/images/landing/${f}.jpg`} alt="" loading="lazy" />
          </div>
        ))}
      </div>

      <p className={s.credito}>Fotos: Unsplash</p>
    </section>
  );
}
