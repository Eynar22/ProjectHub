/* ============================================================================
 * src/pages/inicio-nuevo/Cierre.tsx
 * Última parte de la portada nueva:
 *  - Preguntas frecuentes (las mismas de la portada actual), en acordeón.
 *  - Cierre: un mazo chico que se abre (eco del hero), título grande y botón.
 *  - Pie con logo, enlaces y año.
 * ========================================================================= */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ODS_POR_ID } from '@/shared/constants/ods';
import s from './Cierre.module.css';

const PREGUNTAS = [
  { q: '¿Quién puede publicar proyectos?', a: 'El administrador de una empresa registrada y aprobada. Al registrar tu empresa subes su documentación; el equipo de ProjectHub la revisa y, una vez aprobada, ya puedes publicar.' },
  { q: '¿Puedo postular sin pertenecer a una empresa?', a: 'Sí. Crea una cuenta como profesional independiente y postula a cualquier proyecto abierto con tu propuesta de solución y tu CV.' },
  { q: '¿Cómo me uno al equipo de mi empresa?', a: 'Regístrate eligiendo tu empresa y adjunta un documento que acredite que trabajas ahí. El administrador de la empresa aprueba tu solicitud.' },
  { q: '¿Qué pasa cuando aceptan mi postulación?', a: 'Pasas a formar parte del grupo de trabajo del proyecto, con acceso a sus tareas, chat y archivos.' },
  { q: '¿Qué son los ODS?', a: 'Son los 17 Objetivos de Desarrollo Sostenible de la ONU (fin de la pobreza, educación de calidad, acción por el clima, etc.). Cada proyecto indica a cuáles aporta, y así se ve el impacto de todos juntos.' },
];

const CARTAS = [
  { img: '/images/landing/bolivia-murales.jpg' },
  { ods: 4, color: ODS_POR_ID[4].color },
  { img: '/images/landing/equipos.jpg' },
  { ods: 7, color: ODS_POR_ID[7].color },
  { img: '/images/landing/profesionales.jpg' },
];

/** `true` la primera vez que el elemento entra en pantalla. */
function useAlVer<T extends Element>(umbral = 0.3) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (visible || !ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: umbral });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible, umbral]);
  return [ref, visible] as const;
}

function Palabras({ texto, visible, retraso = 0, className }: { texto: string; visible: boolean; retraso?: number; className?: string }) {
  return (
    <>
      {texto.split(' ').map((w, i) => (
        <span
          key={i}
          className={`${s.w} ${className ?? ''}`}
          style={{
            opacity: visible ? 1 : 0,
            filter: visible ? 'blur(0)' : 'blur(10px)',
            transform: visible ? 'none' : 'translateY(8px)',
            transition: `opacity .6s ${retraso + i * 0.05}s, filter .6s ${retraso + i * 0.05}s, transform .6s ${retraso + i * 0.05}s`,
          }}
        >
          {w}{' '}
        </span>
      ))}
    </>
  );
}

export function Cierre() {
  const [abierta, setAbierta] = useState<number | null>(0);
  const [refPreg, verPreg] = useAlVer<HTMLDivElement>();
  const [refCierre, verCierre] = useAlVer<HTMLElement>(0.35);

  return (
    <>
      <section id="preguntas" className={s.preguntas}>
        <div ref={refPreg} className={s.pregIzq}>
          <p className={s.eyebrow}>Preguntas</p>
          <h2 className={s.pregTitulo}><Palabras texto="Lo que más nos preguntan." visible={verPreg} /></h2>
          <p className={s.pregSub}>¿No encuentras tu respuesta? Crea tu cuenta y explora la plataforma: <Link to="/register">empieza aquí</Link>.</p>
        </div>

        <ul className={s.lista}>
          {PREGUNTAS.map((p, i) => {
            const abiertaEsta = abierta === i;
            return (
              <li key={p.q} className={`${s.item} ${abiertaEsta ? s.abierta : ''}`}>
                <button
                  type="button"
                  className={s.boton}
                  aria-expanded={abiertaEsta}
                  aria-controls={`resp-${i}`}
                  onClick={() => setAbierta(abiertaEsta ? null : i)}
                >
                  {p.q}
                  <span className={s.mas2} aria-hidden="true" />
                </button>
                <div id={`resp-${i}`} className={s.respuesta} role="region">
                  <div><p>{p.a}</p></div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section ref={refCierre} className={s.cierre}>
        <div className={`${s.mazo} ${verCierre ? s.abierto : ''}`} aria-hidden="true">
          {CARTAS.map((c, i) => (
            <div key={i} className={`${s.carta} ${'ods' in c ? s.ods : ''}`} style={{ background: 'ods' in c ? c.color : undefined, zIndex: i === 2 ? 5 : 3 - Math.abs(i - 2) }}>
              <img src={'ods' in c ? `/images/ods/${c.ods}.png` : c.img} alt="" />
            </div>
          ))}
        </div>
        <h2 className={s.cierreTitulo}>
          <Palabras texto="¿Tienes un problema que resolver?" visible={verCierre} retraso={0.3} />
          <Palabras texto="Empieza hoy." visible={verCierre} retraso={0.65} className={s.rojo} />
        </h2>
        <p className={s.cierreSub}>Crear una cuenta es gratis. Publica tu proyecto o postula al que te interese.</p>
        <div className={s.acciones}>
          <Link to="/register" className={s.btn}>Crear cuenta</Link>
          <Link to="/explore" className={s.mas}>Ver proyectos abiertos</Link>
        </div>
      </section>

      <footer className={s.pie}>
        <Link to="/" className={s.logo}><i />ProjectHub</Link>
        <ul className={s.enlaces}>
          <li><Link to="/explore">Proyectos</Link></li>
          <li><Link to="/empresas">Empresas</Link></li>
          <li><Link to="/login">Ingresar</Link></li>
          <li><Link to="/register">Crear cuenta</Link></li>
        </ul>
        <span>© {new Date().getFullYear()} ProjectHub · Hecho en Bolivia</span>
      </footer>
    </>
  );
}
