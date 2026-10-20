/* ============================================================================
 * src/pages/inicio-nuevo/ComoFunciona.tsx
 * "Cómo funciona" de la portada nueva, como motion graphics guiado por el
 * scroll. La tarjeta de un proyecto queda fija y cada paso le pasa algo:
 *   1. Publicar — la tarjeta se arma: foto, ODS uno a uno y sello de revisión.
 *   2. Postular — llegan propuestas volando y se abren en abanico.
 *   3. Elegir   — una propuesta pasa al frente en guinda; las demás caen.
 *   4. Trabajar — entra el equipo y la barra de tareas se va llenando.
 * A la izquierda cambia el texto del paso y una barra segmentada marca el
 * avance. Solo colores de la paleta oficial. El proyecto es ilustrativo.
 * ========================================================================= */

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Check } from 'lucide-react';
import s from './ComoFunciona.module.css';

const PASOS = [
  {
    corto: 'Publicar',
    titulo: 'La empresa publica su problema.',
    texto: 'Describe qué necesita resolver, las fechas y a qué ODS aporta. Nuestro equipo revisa cada empresa antes de activarla.',
  },
  {
    corto: 'Postular',
    titulo: 'Los profesionales postulan.',
    texto: 'Cada interesado envía su propuesta de solución con su CV. La empresa las ve todas juntas, en un mismo lugar.',
  },
  {
    corto: 'Elegir',
    titulo: 'La empresa elige la mejor.',
    texto: 'Compara las propuestas, conversa con los postulantes y acepta la que mejor resuelve el problema.',
  },
  {
    corto: 'Trabajar',
    titulo: 'Y trabajan juntos.',
    texto: 'Se abre el grupo de trabajo del proyecto: tareas, chat y archivos del equipo, todo en ProjectHub.',
  },
] as const;

// Estado de la tarjeta en cada paso, cada uno con un color de la paleta.
const ESTADOS = [
  { t: 'Publicado', background: 'var(--gray-200)', color: 'var(--gray-900)' },
  { t: 'propuestas', background: 'var(--gray-600)', color: 'var(--gray-50)' },
  { t: 'Propuesta aceptada', background: 'var(--guinda-100)', color: 'var(--guinda-600)' },
  { t: 'En curso', background: 'var(--primary)', color: 'var(--primary-foreground)' },
];

// Personas: postulan en el paso 2 y forman el equipo en el 4.
const GENTE = [
  { ini: 'AR', nombre: 'Ana R.', rol: 'Ing. ambiental', bg: 'var(--gray-600)', fg: 'var(--gray-50)' },
  { ini: 'ES', nombre: 'Equipo Sensa', rol: 'IoT y datos', bg: 'var(--primary)', fg: 'var(--primary-foreground)' },
  { ini: 'LM', nombre: 'Luis M.', rol: 'Hidrólogo', bg: 'var(--guinda-100)', fg: 'var(--guinda-600)' },
  { ini: 'MQ', nombre: 'Municipio', rol: 'Empresa', bg: 'var(--gray-900)', fg: 'var(--gray-50)' },
];
const ELEGIDA = 1;

const ODS = [6, 3, 11];

// Inclinación de la tarjeta en cada paso.
const GIROS = ['rotateY(-10deg) rotateZ(-2deg)', 'rotateY(10deg) rotateZ(1.5deg)', 'rotateY(-4deg) rotateZ(-.5deg)', 'rotateY(0deg) rotateZ(0deg)'];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function ComoFunciona() {
  const seccion = useRef<HTMLElement>(null);
  const [paso, setPaso] = useState(0);
  const [sub, setSub] = useState(0); // avance dentro del paso actual (0..1)
  const [reducir] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    let raf = 0;
    const medir = () => {
      const r = seccion.current!.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - innerHeight), 0, 0.9999);
      const x = p * PASOS.length;
      setPaso(Math.floor(x));
      // Redondeado a 1/40 para no re-renderizar en cada píxel.
      setSub(Math.round((x % 1) * 40) / 40);
      raf = requestAnimationFrame(medir);
    };
    raf = requestAnimationFrame(medir);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Estilo de cada palabra: entra escalonada cuando su paso está activo.
  const palabra = (activo: boolean, i: number) => ({
    opacity: activo ? 1 : 0,
    filter: activo || reducir ? 'blur(0)' : 'blur(10px)',
    transform: activo || reducir ? 'none' : 'translateY(8px)',
    transition: reducir ? 'none' : `opacity .5s ${activo ? i * 0.04 : 0}s, filter .5s ${activo ? i * 0.04 : 0}s, transform .5s ${activo ? i * 0.04 : 0}s`,
  });

  // Paso 2: las propuestas llegan una a una según el avance.
  const llegadas = paso === 1 ? Math.min(3, Math.floor(sub * 4) + 1) : paso > 1 ? 3 : 0;
  const estadoPropuesta = (i: number) => {
    if (paso < 1 || paso > 2) return 'fuera';
    if (paso === 1) return i < llegadas ? 'llega' : 'fuera';
    return i === ELEGIDA ? 'elegida' : 'descartada';
  };
  const tareas = paso === 3 ? Math.min(4, 1 + Math.floor(sub * 4)) : 0;
  const estado = ESTADOS[paso];

  return (
    <section ref={seccion} id="como-funciona" className={s.seccion}>
      <div className={s.escena}>
        {/* Texto del paso */}
        <div className={s.columnaTexto}>
          <p className={s.eyebrow}>Cómo funciona</p>
          <div className={s.pasos}>
            {PASOS.map((pa, n) => {
              const activo = n === paso;
              const palabrasTitulo = pa.titulo.split(' ');
              return (
                <div key={pa.corto} className={s.paso} aria-hidden={!activo}>
                  <p className={s.numero} style={palabra(activo, 0)}>
                    <b>0{n + 1}</b> de 0{PASOS.length}
                  </p>
                  <h2>
                    {palabrasTitulo.map((w, i) => <span key={i} className={s.w} style={palabra(activo, i + 1)}>{w} </span>)}
                  </h2>
                  <p className={s.texto} style={palabra(activo, palabrasTitulo.length + 1)}>{pa.texto}</p>
                </div>
              );
            })}
          </div>
          <ol className={s.indice} aria-label="Pasos">
            {PASOS.map((pa, n) => (
              <li key={pa.corto} className={n === paso ? s.activo : n < paso ? s.hecho : ''}>
                <i className={s.barra}><b style={{ transform: `scaleX(${n < paso ? 1 : n === paso ? Math.max(0.04, sub) : 0})` }} /></i>
                {pa.corto}
              </li>
            ))}
          </ol>
        </div>

        {/* Tarjeta animada */}
        <div className={s.mesa} aria-hidden="true">
          <div className={s.mancha} data-paso={paso} />
          <span key={paso} className={s.numeroFondo}>0{paso + 1}</span>

          <div className={s.ancla}>
            {/* Paso 2-3: propuestas en abanico detrás de la tarjeta */}
            {GENTE.slice(0, 3).map((g, i) => (
              <div key={g.ini} className={s.propuesta} data-i={i} data-estado={estadoPropuesta(i)}>
                <span className={s.avatar} style={{ background: g.bg, color: g.fg }}>{g.ini}</span>
                <span className={s.propTexto}><b>{g.nombre}</b><small>{g.rol}</small></span>
                <span className={s.propCheck}><Check size={14} strokeWidth={3} /></span>
              </div>
            ))}

            <div className={s.tarjeta} style={{ transform: reducir ? 'none' : GIROS[paso] }}>
              <div className={s.foto}>
                <img src="/images/landing/bolivia-salar.jpg" alt="" />
                <span className={s.sello} data-on={paso === 0 && sub > 0.35}>
                  <BadgeCheck size={16} /> Empresa verificada
                </span>
              </div>
              <div className={s.cuerpo}>
                <h3>Monitoreo de agua potable</h3>
                <small>Proyecto de ejemplo · Oruro</small>
                <div className={s.pie}>
                  <div className={s.ods}>
                    {ODS.map((id, i) => (
                      <img key={id} src={`/images/ods/${id}.png`} alt="" data-on={paso > 0 || sub > 0.1 + i * 0.12} />
                    ))}
                  </div>
                  <span key={paso} className={s.estado} style={{ background: estado.background, color: estado.color }}>
                    {paso === 1 ? `${llegadas} ${estado.t}` : estado.t}
                  </span>
                </div>

                {/* Paso 4: el equipo y sus tareas */}
                <div className={s.equipo} data-on={paso === 3}>
                  <div className={s.avatares}>
                    {GENTE.map((g, i) => (
                      <span key={g.ini} className={s.avatar} style={{ background: g.bg, color: g.fg, transitionDelay: paso === 3 ? `${i * 0.08}s` : '0s' }}>{g.ini}</span>
                    ))}
                  </div>
                  <div className={s.tareas}>
                    <i><b style={{ transform: `scaleX(${tareas / 4})` }} /></i>
                    <span>{tareas}/4 tareas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
