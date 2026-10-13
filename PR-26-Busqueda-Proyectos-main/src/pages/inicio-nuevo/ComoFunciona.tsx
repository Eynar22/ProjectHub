/* ============================================================================
 * src/pages/inicio-nuevo/ComoFunciona.tsx
 * "Cómo funciona" de la portada nueva. Mismas piezas que el hero: letra
 * grande, palabras que entran de borroso a nítido, una tarjeta y burbujas.
 * Al bajar, la tarjeta de un proyecto queda fija y le van apareciendo
 * burbujas, una por paso; a la izquierda cambia el texto del paso.
 * El proyecto es un ejemplo ilustrativo.
 * ========================================================================= */

import { useEffect, useRef, useState } from 'react';
import s from './ComoFunciona.module.css';

const PASOS = [
  {
    corto: 'Publicar',
    titulo: 'La empresa publica su problema.',
    texto: 'Describe qué necesita resolver, las fechas y a qué ODS aporta. Nuestro equipo revisa cada empresa antes de activarla.',
    estado: 'Publicado',
    burbuja: { t: 'Empresa', color: 'var(--azul)', lado: 'izq', pos: { left: '-8%', top: '-6%' } },
  },
  {
    corto: 'Postular',
    titulo: 'Los profesionales postulan.',
    texto: 'Cada interesado envía su propuesta de solución con su CV. La empresa las ve todas juntas, en un mismo lugar.',
    estado: '3 propuestas',
    burbuja: { t: 'Propuesta enviada', color: 'var(--verde)', lado: 'der', pos: { right: '-12%', top: '18%' } },
  },
  {
    corto: 'Elegir',
    titulo: 'La empresa elige la mejor.',
    texto: 'Compara las propuestas, conversa con los postulantes y acepta la que mejor resuelve el problema.',
    estado: 'Propuesta aceptada',
    burbuja: { t: 'Aceptada', color: 'var(--rojo)', lado: 'izq', pos: { left: '-10%', top: '52%' } },
  },
  {
    corto: 'Trabajar',
    titulo: 'Y trabajan juntos.',
    texto: 'Se abre el grupo de trabajo del proyecto: tareas, chat y archivos del equipo, todo en ProjectHub.',
    estado: 'En curso',
    burbuja: { t: 'Equipo · 4 tareas', color: 'var(--tinta)', lado: 'der', pos: { right: '-6%', bottom: '-5%' } },
  },
] as const;

// Inclinación de la tarjeta en cada paso: se mueve un poco para acompañar el cambio.
const GIROS = ['rotateY(-10deg) rotateZ(-2deg)', 'rotateY(8deg) rotateZ(1.5deg)', 'rotateY(-6deg) rotateZ(-1deg)', 'rotateY(0deg) rotateZ(0deg)'];
const COLOR_ESTADO = [
  { background: 'var(--linea-suave)', color: 'var(--tinta)' },
  { background: 'var(--success-subtle)', color: 'var(--verde)' },
  { background: 'var(--danger-subtle)', color: 'var(--rojo)' },
  { background: 'var(--tinta)', color: 'var(--sobre-tinta)' },
];

export function ComoFunciona() {
  const seccion = useRef<HTMLElement>(null);
  const [paso, setPaso] = useState(0);
  const [reducir] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    let raf = 0;
    const medir = () => {
      const r = seccion.current!.getBoundingClientRect();
      const p = Math.min(0.999, Math.max(0, -r.top / (r.height - innerHeight)));
      setPaso(Math.floor(p * PASOS.length));
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

  return (
    <section ref={seccion} id="como-funciona" className={s.seccion}>
      <div className={s.escena}>
        {/* Texto del paso */}
        <div>
          <p className={s.eyebrow}>Cómo funciona</p>
          <div className={s.pasos}>
            {PASOS.map((pa, n) => {
              const activo = n === paso;
              const palabrasTitulo = pa.titulo.split(' ');
              return (
                <div key={pa.corto} className={s.paso} aria-hidden={!activo}>
                  <p className={s.numero} style={palabra(activo, 0)}>Paso {n + 1} de {PASOS.length}</p>
                  <h2>
                    {palabrasTitulo.map((w, i) => <span key={i} className={s.w} style={palabra(activo, i + 1)}>{w} </span>)}
                  </h2>
                  <p style={palabra(activo, palabrasTitulo.length + 1)}>{pa.texto}</p>
                </div>
              );
            })}
          </div>
          <ol className={s.indice} aria-label="Pasos">
            {PASOS.map((pa, n) => (
              <li key={pa.corto} className={n === paso ? s.activo : n < paso ? s.hecho : ''}>
                {n + 1}. {pa.corto}
              </li>
            ))}
          </ol>
        </div>

        {/* Tarjeta con burbujas */}
        <div className={s.mesa} aria-hidden="true">
          <div style={{ position: 'relative' }}>
            <div className={s.tarjeta} style={{ transform: reducir ? 'none' : GIROS[paso] }}>
              <div className={s.foto}><img src="/images/landing/bolivia-salar.jpg" alt="" /></div>
              <div className={s.cuerpo}>
                <h3>Monitoreo de agua potable</h3>
                <small>Proyecto de ejemplo · Oruro</small>
                <div className={s.pie}>
                  <div className={s.ods}>
                    <img src="/images/ods/6.png" alt="" />
                    <img src="/images/ods/3.png" alt="" />
                    <img src="/images/ods/11.png" alt="" />
                  </div>
                  <span className={s.estado} style={COLOR_ESTADO[paso]}>{PASOS[paso].estado}</span>
                </div>
              </div>
            </div>

            {PASOS.map((pa, n) => (
              <span
                key={pa.burbuja.t}
                className={`${s.burbuja} ${pa.burbuja.lado === 'izq' ? s.izq : s.der} ${n <= paso ? s.visible : ''}`}
                style={{ background: pa.burbuja.color, color: pa.burbuja.color === 'var(--tinta)' ? 'var(--sobre-tinta)' : undefined, ...pa.burbuja.pos }}
              >
                {pa.burbuja.t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
