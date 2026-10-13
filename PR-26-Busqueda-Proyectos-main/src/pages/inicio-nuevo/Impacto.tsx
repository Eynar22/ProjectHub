/* ============================================================================
 * src/pages/inicio-nuevo/Impacto.tsx
 * "Impacto (ODS)" de la portada nueva, basado en la rueda del landing actual.
 *  - Cifras reales: proyectos con ODS, objetivos cubiertos y el más trabajado.
 *  - Rueda con los 17 ODS que GIRA para llevar el elegido arriba; al centro,
 *    el elegido en grande. Los ODS sin proyectos quedan atenuados.
 *  - Ficha con el objetivo oficial y los proyectos reales que aportan.
 *  - Recorre sola los ODS con proyectos hasta que la persona elige uno.
 * Solo cuentan proyectos en curso y no suspendidos (los visibles en Explorar).
 * ========================================================================= */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useProyectos } from '@/features/proyectos';
import { ODS_LIST } from '@/shared/constants/ods';
import { ProjectImage } from '@/shared/components/ui/ProjectImage';
import s from './Impacto.module.css';

const ROTAR_MS = 3800;
const PASO = 360 / 17;

export function Impacto() {
  const { data: proyectos = [] } = useProyectos();
  const reducir = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  const visibles = useMemo(() => proyectos.filter(p => p.estado === 'en_curso' && !p.suspendido), [proyectos]);
  const ods = useMemo(
    () => ODS_LIST.map(o => {
      const suyos = visibles.filter(p => Array.isArray(p.ods) && p.ods.includes(o.id));
      return { ...o, total: suyos.length, proyectos: suyos };
    }),
    [visibles],
  );
  const conProyectos = useMemo(() => ods.filter(o => o.total > 0), [ods]);
  const masTrabajado = [...conProyectos].sort((a, b) => b.total - a.total)[0];
  const proyectosConOds = visibles.filter(p => Array.isArray(p.ods) && p.ods.length > 0).length;

  const [activoId, setActivoId] = useState<number | null>(null);
  const [auto, setAuto] = useState(!reducir);
  const activo = ods.find(o => o.id === (activoId ?? masTrabajado?.id ?? 1))!;
  const indiceActivo = activo.id - 1;
  const fichas = useRef<(HTMLButtonElement | null)[]>([]);

  // Giro acumulado: siempre por el camino más corto, sin vueltas completas de más.
  // Se ajusta durante el render cuando cambia el ODS activo (patrón de React
  // para derivar estado de otro, sin efecto).
  const [giro, setGiro] = useState(-indiceActivo * PASO);
  const [indicePrevio, setIndicePrevio] = useState(indiceActivo);
  if (indicePrevio !== indiceActivo) {
    setIndicePrevio(indiceActivo);
    let d = (-indiceActivo * PASO - giro) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    setGiro(giro + d);
  }

  // Recorrido automático por los ODS con proyectos.
  useEffect(() => {
    if (!auto) return;
    const ciclo = conProyectos.length > 1 ? conProyectos : ods;
    const t = setTimeout(() => {
      const i = ciclo.findIndex(o => o.id === activo.id);
      setActivoId(ciclo[(i + 1) % ciclo.length].id);
    }, ROTAR_MS);
    return () => clearTimeout(t);
  }, [auto, activo.id, conProyectos, ods]);

  // Animación de la ficha al cambiar de ODS, sin desmontarla.
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducir || !panel.current) return;
    panel.current.animate(
      [{ opacity: 0, filter: 'blur(8px)', transform: 'translateY(8px)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }],
      { duration: 550, easing: 'cubic-bezier(.16,1,.3,1)' },
    );
  }, [activo.id, reducir]);

  const elegir = (id: number) => { setAuto(false); setActivoId(id); };
  const teclado = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const sig = (i + d + 17) % 17;
    elegir(sig + 1);
    fichas.current[sig]?.focus();
  };

  // Título que entra palabra por palabra al aparecer.
  const cabecera = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(reducir);
  useEffect(() => {
    if (visible || !cabecera.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(cabecera.current);
    return () => io.disconnect();
  }, [visible]);
  const titulo = 'Cada proyecto suma a un objetivo más grande.';

  return (
    <section id="impacto" className={s.seccion}>
      <p className={s.eyebrow}>Impacto · ODS de la ONU</p>
      <div ref={cabecera} className={s.cabecera}>
        <h2 className={s.titulo}>
          {titulo.split(' ').map((w, i) => (
            <span key={i} className={s.w} style={{ opacity: visible ? 1 : 0, filter: visible ? 'blur(0)' : 'blur(10px)', transition: `opacity .6s ${i * 0.05}s, filter .6s ${i * 0.05}s` }}>
              {w}{' '}
            </span>
          ))}
        </h2>
        <div className={s.cifras}>
          <div className={s.cifra}><b>{proyectosConOds}</b><span>{proyectosConOds === 1 ? 'proyecto con ODS declarados' : 'proyectos con ODS declarados'}</span></div>
          <div className={s.cifra}><b>{conProyectos.length}<small> / 17</small></b><span>objetivos con al menos un proyecto</span></div>
          <div className={s.cifra}><b>{masTrabajado ? masTrabajado.id : '—'}</b><span>{masTrabajado ? `ODS más trabajado: ${masTrabajado.nombre}` : 'Aún no hay un ODS más trabajado'}</span></div>
        </div>
      </div>

      <div className={s.cuerpo}>
        {/* Rueda */}
        <div className={s.rueda} role="group" aria-label="Objetivos de Desarrollo Sostenible">
          <div className={s.giro} style={{ transform: `rotate(${giro}deg)` }}>
            {ods.map((o, i) => {
              const ang = (i * PASO - 90) * (Math.PI / 180);
              return (
                <button
                  key={o.id}
                  ref={el => { fichas.current[i] = el; }}
                  type="button"
                  className={`${s.ficha} ${o.total === 0 ? s.vacia : ''} ${o.id === activo.id ? s.activa : ''}`}
                  style={{
                    '--c': o.color,
                    left: `${50 + Math.cos(ang) * 43}%`,
                    top: `${50 + Math.sin(ang) * 43}%`,
                    // Contragiro: la ficha queda derecha aunque la rueda gire.
                    transform: `rotate(${-giro}deg) scale(${o.id === activo.id ? 1.18 : 1})`,
                  } as CSSProperties}
                  onClick={() => elegir(o.id)}
                  onKeyDown={e => teclado(e, i)}
                  tabIndex={o.id === activo.id ? 0 : -1}
                  aria-pressed={o.id === activo.id}
                  aria-label={`ODS ${o.id}: ${o.nombre}. ${o.total} ${o.total === 1 ? 'proyecto' : 'proyectos'}`}
                >
                  <img src={`/images/ods/${o.id}.png`} alt="" />
                  {o.total > 0 && <span className={s.cuenta}>{o.total}</span>}
                </button>
              );
            })}
          </div>
          {/* Los 17 íconos grandes se montan una sola vez y solo se muestra el
              activo: así no se vuelven a pedir al servidor en cada cambio. */}
          <div className={s.centro} aria-hidden="true">
            {ods.map(o => (
              <img
                key={o.id}
                src={`/images/ods/${o.id}.png`}
                alt=""
                className={`${s.centroImg} ${o.id === activo.id ? s.centroActiva : ''}`}
                style={{ background: o.color }}
              />
            ))}
          </div>
        </div>

        {/* Ficha del ODS elegido (se anima sin volver a montarse) */}
        <div ref={panel} className={s.panel} aria-live="polite">
          <p className={s.panelNum} style={{ color: activo.color }}>ODS {activo.id}</p>
          <h3>{activo.nombre}</h3>
          <p className={s.panelMeta}>{activo.meta}</p>

          {activo.total > 0 ? (
            <>
              <p className={s.panelCuenta}>{activo.total} {activo.total === 1 ? 'proyecto aporta' : 'proyectos aportan'} a este objetivo</p>
              <ul className={s.lista}>
                {activo.proyectos.slice(0, 3).map(p => (
                  <li key={p.id}>
                    <Link to={`/project/${p.id}`} className={s.proyecto}>
                      <ProjectImage imagenes={p.imagenes} alt="" className={s.img} />
                      <div>
                        <strong>{p.nombre}</strong>
                        {p.creador?.empresa?.nombre && <small>{p.creador.empresa.nombre}</small>}
                      </div>
                      <ArrowRight className={s.flecha} size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={s.vacioTxt}>Todavía nadie trabaja en este objetivo. ¿Tu empresa tiene un proyecto que aporte aquí? Publícalo y sé la primera.</p>
          )}

          <div className={s.acciones}>
            <Link to={activo.total > 0 ? '/explore' : '/register'} className={s.btn}>
              {activo.total > 0 ? 'Ver en Explorar' : 'Publicar un proyecto'}
            </Link>
            {auto && <button type="button" className={s.pausa} onClick={() => setAuto(false)}>Pausar recorrido</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
