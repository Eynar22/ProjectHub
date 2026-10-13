/* ============================================================================
 * src/pages/proyectos/ProyectosPublico.tsx
 * Proyectos abiertos para VISITANTES, con el estilo de la portada.
 * (Con sesión iniciada se sigue mostrando la versión del sistema.)
 * Muestra lo que invita (foto, título, problema, ODS, empresa) y deja cerrado
 * el detalle (fechas, financiamiento, postular): para eso hay que registrarse.
 * Filtros: búsqueda, categoría y ODS en la URL (?ods=6), como antes.
 * ========================================================================= */

import { useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Lock, Search } from 'lucide-react';
import { LIMITES } from '@/shared/validacion';
import { useProyectos, type Project } from '@/features/proyectos';
import { PROJECT_CATEGORIES } from '@/shared/constants/proyecto';
import { ODS_LIST, ODS_POR_ID, etiquetaOds } from '@/shared/constants/ods';
import { NavPortada } from '@/pages/portada/NavPortada';
import { useFuenteGeist } from '@/pages/portada/useFuenteGeist';
import e from '@/pages/empresas/EmpresasPublico.module.css';
import s from './ProyectosPublico.module.css';

const DIAS_NUEVO = 14;

export default function ProyectosPublico() {
  useFuenteGeist();
  const { data: proyectos = [], isLoading, isError } = useProyectos();
  const [busqueda, setBusqueda] = useState('');
  const [ahora] = useState(() => Date.now()); // para marcar los proyectos nuevos
  const [categoria, setCategoria] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const odsParam = Number(searchParams.get('ods'));
  const odsFiltro = ODS_POR_ID[odsParam] ? odsParam : null;
  const elegirOds = (id: number | null) => {
    const sig = new URLSearchParams(searchParams);
    if (id) sig.set('ods', String(id)); else sig.delete('ods');
    setSearchParams(sig, { replace: true });
  };

  // Solo proyectos abiertos (en curso) y no suspendidos, más recientes primero.
  const abiertos = proyectos.filter(p => (!p.estado || p.estado === 'en_curso') && !p.suspendido).sort((a, b) => b.id - a.id);
  const texto = busqueda.trim().toLowerCase();
  const filtrados = abiertos.filter(p =>
    (!texto || p.nombre.toLowerCase().includes(texto) || p.creador?.empresa?.nombre?.toLowerCase().includes(texto) || p.problema?.toLowerCase().includes(texto)) &&
    (!categoria || p.categoria === categoria) &&
    (!odsFiltro || (Array.isArray(p.ods) && p.ods.includes(odsFiltro))),
  );
  const categorias = PROJECT_CATEGORIES.filter(c => abiertos.some(p => p.categoria === c));
  const odsPresentes = ODS_LIST.filter(o => abiertos.some(p => p.ods?.includes(o.id)));
  const empresas = new Set(abiertos.map(p => p.creador?.empresa?.nombre).filter(Boolean)).size;
  const hayFiltro = !!texto || !!categoria || !!odsFiltro;
  const titulo = 'Problemas reales esperando a quien sepa resolverlos.';

  return (
    <div className={e.raiz}>
      <NavPortada />

      <header className={e.cabecera}>
        <div>
          <p className={`${e.eyebrow} ${e.aparece}`}>Proyectos abiertos</p>
          <h1 className={e.titulo}>
            {titulo.split(' ').map((w, i) => <span key={i} className={e.w} style={{ animationDelay: `${0.1 + i * 0.06}s` }}>{w} </span>)}
          </h1>
        </div>
        <div className={`${e.cifras} ${e.aparece}`} style={{ animationDelay: '.5s' }}>
          <div className={e.cifra}><b>{abiertos.length}</b><span>{abiertos.length === 1 ? 'proyecto abierto' : 'proyectos abiertos'}</span></div>
          <div className={e.cifra}><b>{empresas}</b><span>{empresas === 1 ? 'empresa publicando' : 'empresas publicando'}</span></div>
          <div className={e.cifra}><b>{odsPresentes.length}</b><span>ODS en juego</span></div>
        </div>
      </header>

      <div className={s.aviso}>
        <p>
          Crea tu cuenta para ver el detalle completo y postular.
          <small>Fechas, financiamiento y documentos de cada proyecto. Es gratis.</small>
        </p>
        <Link to="/register">Crear cuenta</Link>
      </div>

      <div className={e.barra} style={{ marginTop: '4vh' }}>
        <label className={e.buscador}>
          <Search size={19} aria-hidden="true" />
          <input type="text" aria-label="Buscar proyectos" placeholder="Buscar por proyecto, empresa o problema…"
            value={busqueda} maxLength={LIMITES.busqueda} onChange={ev => setBusqueda(ev.target.value)} />
        </label>
        {categorias.length > 0 && (
          <div className={s.chips} role="group" aria-label="Filtrar por categoría">
            <button type="button" className={`${s.chip} ${!categoria ? s.chipOn : ''}`} aria-pressed={!categoria} onClick={() => setCategoria('')}>Todas</button>
            {categorias.map(c => (
              <button key={c} type="button" className={`${s.chip} ${categoria === c ? s.chipOn : ''}`} aria-pressed={categoria === c} onClick={() => setCategoria(categoria === c ? '' : c)}>{c}</button>
            ))}
          </div>
        )}
        {odsPresentes.length > 0 && (
          <div className={e.filtros} role="group" aria-label="Filtrar por ODS">
            <small>ODS:</small>
            {odsPresentes.map(o => {
              const on = odsFiltro === o.id;
              return (
                <button key={o.id} type="button" title={etiquetaOds(o.id)} aria-label={etiquetaOds(o.id)} aria-pressed={on}
                  className={`${e.ods} ${on ? e.odsOn : ''}`} style={{ '--c': o.color } as CSSProperties} onClick={() => elegirOds(on ? null : o.id)}>
                  <img src={`/images/ods/${o.id}.png`} alt="" />
                </button>
              );
            })}
            {odsFiltro && <button type="button" className={e.quitar} onClick={() => elegirOds(null)}>Quitar filtro</button>}
          </div>
        )}
        {hayFiltro && !isLoading && (
          <p className={e.resultado} aria-live="polite">{filtrados.length} {filtrados.length === 1 ? 'proyecto' : 'proyectos'}</p>
        )}
      </div>

      <main id="contenido" className={s.grilla}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${e.cargando} ${i === 0 ? s.destacada : ''}`} style={{ height: 'auto' }} />)
        ) : isError ? (
          <p className={e.vacio} style={{ gridColumn: '1 / -1' }}>No se pudieron cargar los proyectos. Intenta de nuevo en unos minutos.</p>
        ) : filtrados.length === 0 ? (
          <p className={e.vacio} style={{ gridColumn: '1 / -1' }}>{abiertos.length === 0 ? 'Todavía no hay proyectos abiertos.' : 'Ningún proyecto coincide con la búsqueda.'}</p>
        ) : (
          filtrados.map((p, i) => <Tarjeta key={p.id} p={p} indice={i} ahora={ahora} destacada={i === 0 && !hayFiltro && filtrados.length > 2} />)
        )}
      </main>

      <section className={e.cierre}>
        <h2>¿Tienes un problema que resolver? Publícalo.</h2>
        <Link to="/register" className={e.btn}>Registrar mi empresa</Link>
      </section>
    </div>
  );
}

function Tarjeta({ p, indice, destacada, ahora }: { p: Project; indice: number; destacada: boolean; ahora: number }) {
  const foto = p.imagenes?.[0]?.url;
  const color = p.ods?.length ? ODS_POR_ID[p.ods[0]]?.color : undefined;
  const empresa = p.creador?.empresa;
  const nuevo = p.fecha_creacion && ahora - new Date(p.fecha_creacion).getTime() < DIAS_NUEVO * 864e5;
  const problema = p.problema || p.descripcion_corta;
  return (
    // El detalle es solo para usuarios registrados: la tarjeta lleva a crear cuenta.
    <Link to="/register" className={`${s.tarjeta} ${destacada ? s.destacada : ''}`} style={{ animationDelay: `${0.15 + Math.min(indice, 8) * 0.07}s` }}
      aria-label={`${p.nombre}. Crea tu cuenta para ver el detalle`}>
      <div className={s.foto} style={{ '--c': color } as CSSProperties}>
        {foto ? <img src={foto} alt="" /> : <div className={s.sinFoto} aria-hidden="true"><span>{p.nombre.trim().charAt(0).toUpperCase()}</span></div>}
        {p.categoria && <span className={s.categoria}>{p.categoria}</span>}
        {nuevo && <span className={s.nuevo}>Nuevo</span>}
      </div>
      <div className={s.cuerpo}>
        {empresa?.nombre && (
          <span className={s.empresa}>
            {empresa.nombre}
          </span>
        )}
        <h2 className={s.titulo}>{p.nombre}</h2>
        {problema && <p className={s.problema}>{p.problema && <b>Problema: </b>}{problema}</p>}
        <div className={s.pie}>
          <div className={s.ods}>
            {(p.ods ?? []).slice(0, destacada ? 6 : 4).map(id => <img key={id} src={`/images/ods/${id}.png`} alt={etiquetaOds(id)} title={etiquetaOds(id)} />)}
          </div>
          <span className={s.candado}><span className={s.candadoTxt}>Ver detalle</span><span><Lock size={16} /></span></span>
        </div>
      </div>
    </Link>
  );
}
