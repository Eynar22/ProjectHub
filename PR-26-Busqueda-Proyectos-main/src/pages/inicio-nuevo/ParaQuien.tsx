/* ============================================================================
 * src/pages/inicio-nuevo/ParaQuien.tsx
 * "Para quién" de la portada nueva: dos paneles grandes, uno por público.
 *  - Empresas: panel guinda (#A31E3A), botón blanco.
 *  - Profesionales: panel carbón (#2E2E2E), botón guinda.
 * Cada panel entra desde su lado, abre su mazo de 3 tarjetas en abanico y
 * sus beneficios aparecen uno a uno. Lleva las rayas diagonales de la marca
 * como adorno. Tarjetas ilustrativas.
 * ========================================================================= */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Building2, FileText, UserRound, type LucideIcon } from 'lucide-react';
import { ODS_POR_ID } from '@/shared/constants/ods';
import s from './ParaQuien.module.css';

/** Palabras que entran de borroso a nítido cuando `visible` pasa a true. */
function Palabras({ texto, visible, retraso = 0 }: { texto: string; visible: boolean; retraso?: number }) {
  return (
    <>
      {texto.split(' ').map((w, i) => (
        <span
          key={i}
          className={s.w}
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

/** Marca `visible` la primera vez que el elemento entra en pantalla. */
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

function Panel({ variante, etiqueta, icono: Icono, titulo, puntos, boton, destino, cartas }: {
  variante: 'empresa' | 'pro';
  etiqueta: string;
  icono: LucideIcon;
  titulo: string;
  puntos: string[];
  boton: string;
  destino: string;
  cartas: ReactNode;
}) {
  const [ref, visible] = useAlVer<HTMLDivElement>(0.2);
  return (
    <div
      ref={ref}
      className={`${s.panel} ${variante === 'empresa' ? s.empresa : s.pro} ${visible ? s.visible : ''}`}
    >
      <span className={s.rayas} aria-hidden="true" />

      <div className={`${s.mazo} ${visible ? s.abierto : ''}`} aria-hidden="true">
        {cartas}
      </div>

      <p className={s.etiqueta}><Icono size={16} /> {etiqueta}</p>
      <h3><Palabras texto={titulo} visible={visible} retraso={0.25} /></h3>
      <ol className={s.lista}>
        {puntos.map((p, i) => (
          <li key={p} style={{ transitionDelay: visible ? `${0.45 + i * 0.08}s` : '0s' }}>
            <span className={s.num}>{i + 1}</span>{p}
          </li>
        ))}
      </ol>
      <Link to={destino} className={s.btn}>{boton} <ArrowRight size={18} /></Link>
    </div>
  );
}

export function ParaQuien() {
  const [refTitulo, verTitulo] = useAlVer<HTMLHeadingElement>();

  return (
    <section id="para-quien" className={s.seccion}>
      <p className={s.eyebrow}>Para quién</p>
      <h2 ref={refTitulo} className={s.titulo}>
        <Palabras texto="Un lugar para quien tiene el problema" visible={verTitulo} />
        <span className={s.acento}><Palabras texto="y para quien sabe resolverlo." visible={verTitulo} retraso={0.3} /></span>
      </h2>

      <div className={s.paneles}>
        <Panel
          variante="empresa"
          etiqueta="Si eres empresa"
          icono={Building2}
          titulo="Publica tu problema."
          puntos={[
            'Publica proyectos con un problema real, fechas y ODS.',
            'Recibe propuestas con CV y compáralas en un solo lugar.',
            'Suma a tus empleados como miembros de la empresa.',
            'Organiza al equipo con tareas, chat y archivos.',
          ]}
          boton="Registrar mi empresa"
          destino="/register"
          cartas={<>
            <div className={s.carta}><img src="/images/landing/bolivia-mercado.jpg" alt="" /><b>Mercados con pago digital</b></div>
            <div className={`${s.carta} ${s.cartaOds}`} style={{ background: ODS_POR_ID[11].color }}><img src="/images/ods/11.png" alt="" /></div>
            <div className={s.carta}><img src="/images/landing/empresas.jpg" alt="" /><b>Capacitación docente rural</b></div>
          </>}
        />
        <Panel
          variante="pro"
          etiqueta="Si eres profesional o equipo"
          icono={UserRound}
          titulo="Resuelve problemas reales."
          puntos={[
            'No necesitas pertenecer a una empresa: postula como independiente.',
            'Encuentra proyectos con impacto real en Bolivia.',
            'Postula con tu propuesta de solución y tu CV.',
            'Trabaja con la empresa desde el primer día.',
          ]}
          boton="Crear mi perfil"
          destino="/register"
          cartas={<>
            <div className={s.carta}><img src="/images/landing/equipos.jpg" alt="" /><b>Equipo de desarrollo</b></div>
            <div className={`${s.carta} ${s.cartaDoc}`}>
              <FileText className={s.icono} strokeWidth={1.5} />
              <span>propuesta.pdf</span>
              <small>Propuesta de solución + CV</small>
            </div>
            <div className={s.carta}><img src="/images/landing/profesionales.jpg" alt="" /><b>Ingeniera ambiental</b></div>
          </>}
        />
      </div>
    </section>
  );
}
