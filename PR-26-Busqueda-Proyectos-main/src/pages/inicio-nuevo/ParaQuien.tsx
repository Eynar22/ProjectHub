/* ============================================================================
 * src/pages/inicio-nuevo/ParaQuien.tsx
 * "Para quién" de la portada nueva: Empresas y Profesionales, cada una con su
 * mazo de 3 tarjetas que se abre en abanico al entrar en pantalla (el hero en
 * chico). Burbujas con los mismos colores del hero: azul empresa, verde
 * profesional. Tarjetas ilustrativas.
 * ========================================================================= */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { FileText } from 'lucide-react';
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
function useAlVer<T extends Element>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (visible || !ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);
  return [ref, visible] as const;
}

function Columna({ titulo, puntos, color, burbuja, boton, destino, cartas }: {
  titulo: string;
  puntos: string[];
  color: string;
  burbuja: string;
  boton: string;
  destino: string;
  cartas: ReactNode;
}) {
  const [ref, visible] = useAlVer<HTMLDivElement>();
  return (
    <div ref={ref} className={s.columna} style={{ ['--punto' as string]: color }}>
      <div className={`${s.mazo} ${visible ? s.abierto : ''}`} aria-hidden="true">
        {cartas}
        <span className={s.burbuja} style={{ background: color }}>{burbuja}</span>
      </div>
      <h3><Palabras texto={titulo} visible={visible} retraso={0.2} /></h3>
      <ul className={s.lista}>
        {puntos.map(p => <li key={p}>{p}</li>)}
      </ul>
      <Link to={destino} className={s.btn}>{boton}</Link>
    </div>
  );
}

export function ParaQuien() {
  const [refTitulo, verTitulo] = useAlVer<HTMLHeadingElement>();

  return (
    <section id="para-quien" className={s.seccion}>
      <p className={s.eyebrow}>Para quién</p>
      <h2 ref={refTitulo} className={s.titulo}>
        <Palabras texto="Un lugar para quien tiene el problema y para quien sabe resolverlo." visible={verTitulo} />
      </h2>

      <div className={s.columnas}>
        <Columna
          titulo="Empresas"
          color="var(--azul)"
          burbuja="Empresa"
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
            <div className={`${s.carta} ${s.cartaOds}`} style={{ background: '#FD9D24' }}><img src="/images/ods/11.png" alt="" /></div>
            <div className={s.carta}><img src="/images/landing/empresas.jpg" alt="" /><b>Capacitación docente rural</b></div>
          </>}
        />
        <Columna
          titulo="Profesionales y equipos"
          color="var(--verde)"
          burbuja="Profesional"
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
