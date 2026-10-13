/* ============================================================================
 * src/pages/proyectos/ProyectosPublico.tsx
 * Proyectos abiertos (/explore). Una sola versión para todos:
 *  - Visitante: muestra lo que invita (foto, título, problema, ODS, empresa) y
 *    el detalle queda cerrado: la tarjeta lleva a crear cuenta.
 *  - Con sesión: misma página dentro del panel (barra lateral), con el logo de
 *    la empresa, fechas, participantes y financiamiento; lleva al proyecto.
 * Las fotos de cada proyecto rotan solas con un fundido (si tiene varias).
 * Filtros: búsqueda, categoría y ODS en la URL (?ods=6).
 * ========================================================================= */

import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, Building2, Calendar, DollarSign, Lock, Search, Users } from 'lucide-react';
import { LIMITES } from '@/shared/validacion';
import { useApp } from '@/app/context/AppContext';
import { useProyectos, type Project } from '@/features/proyectos';
import { useEmpresas, type Company } from '@/features/empresas';
import { useUsuarios } from '@/features/usuarios';
import { PROJECT_CATEGORIES } from '@/shared/constants/proyecto';
import { ODS_LIST, ODS_POR_ID, etiquetaOds } from '@/shared/constants/ods';
import { Navbar } from '@/shared/components/layout/Navbar';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import e from '@/pages/empresas/EmpresasPublico.module.css';
import s from './ProyectosPublico.module.css';

const DIAS_NUEVO = 14;
const ROTAR_FOTO_MS = 4000;

export default function ProyectosPublico() {
  const { currentUser } = useApp();
  const sesion = !!currentUser;
  const { data: proyectos = [], isLoading, isError } = useProyectos();
  const { data: listaEmpresas = [] } = useEmpresas();
  // Con sesión la lista de proyectos no trae la empresa: se resuelve por el
  // creador (proyecto → creador → empresa), igual que la versión anterior.
  const { data: usuarios = [] } = useUsuarios(sesion);
  const empresaDe = (p: Project): Company | undefined => {
    const id = p.creador?.empresa?.id ?? usuarios.find(u => u.id === p.creador_id)?.empresa_id;
    return id != null ? listaEmpresas.find(c => c.id === id) : undefined;
  };
  const nombreEmpresa = (p: Project) => empresaDe(p)?.nombre ?? p.creador?.empresa?.nombre;
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
    (!texto || p.nombre.toLowerCase().includes(texto) || nombreEmpresa(p)?.toLowerCase().includes(texto) || p.problema?.toLowerCase().includes(texto)) &&
    (!categoria || p.categoria === categoria) &&
    (!odsFiltro || (Array.isArray(p.ods) && p.ods.includes(odsFiltro))),
  );
  const categorias = PROJECT_CATEGORIES.filter(c => abiertos.some(p => p.categoria === c));
  const odsPresentes = ODS_LIST.filter(o => abiertos.some(p => p.ods?.includes(o.id)));
  const empresas = new Set(abiertos.map(nombreEmpresa).filter(Boolean)).size;
  const hayFiltro = !!texto || !!categoria || !!odsFiltro;
  const titulo = 'Problemas reales esperando a quien sepa resolverlos.';

  const contenido = (
    <>
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

      {!sesion && (
        <div className={s.aviso}>
          <p>
            Crea tu cuenta para ver el detalle completo y postular.
            <small>Fechas, financiamiento y documentos de cada proyecto. Es gratis.</small>
          </p>
          <Link to="/register">Crear cuenta</Link>
        </div>
      )}

      <div className={e.barra} style={{ marginTop: sesion ? 0 : '4vh' }}>
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

      <div className={s.grilla}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${e.cargando} ${i === 0 ? s.destacada : ''}`} style={{ height: 'auto' }} />)
        ) : isError ? (
          <p className={e.vacio} style={{ gridColumn: '1 / -1' }}>No se pudieron cargar los proyectos. Intenta de nuevo en unos minutos.</p>
        ) : filtrados.length === 0 ? (
          <p className={e.vacio} style={{ gridColumn: '1 / -1' }}>{abiertos.length === 0 ? 'Todavía no hay proyectos abiertos.' : 'Ningún proyecto coincide con la búsqueda.'}</p>
        ) : (
          filtrados.map((p, i) => (
            <Tarjeta key={p.id} p={p} indice={i} ahora={ahora} sesion={sesion} logo={empresaDe(p)?.logo_url ?? null} empresaNombre={nombreEmpresa(p)}
              destacada={i === 0 && !hayFiltro && filtrados.length > 2} />
          ))
        )}
      </div>

      {!sesion && (
        <section className={e.cierre}>
          <h2>¿Tienes un problema que resolver? Publícalo.</h2>
          <Link to="/register" className={e.btn}>Registrar mi empresa</Link>
        </section>
      )}
    </>
  );

  return (
    <div className={e.raiz}>
      <Navbar />
      {sesion ? (
        // Con sesión: dentro del panel, junto a la barra lateral del sistema.
        <div style={{ display: 'flex' }}>
          <Sidebar isAdmin={currentUser?.rol === 'superadmin'} />
          <main id="contenido" tabIndex={-1} style={{ flex: 1, minWidth: 0 }}>{contenido}</main>
        </div>
      ) : (
        <main id="contenido" tabIndex={-1}>{contenido}</main>
      )}
    </div>
  );
}

/** Fotos del proyecto que rotan solas con un fundido. */
function FotosRotativas({ fotos }: { fotos: string[] }) {
  const [actual, setActual] = useState(0);
  useEffect(() => {
    if (fotos.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Cada tarjeta arranca un poco desfasada para que no cambien todas a la vez.
    const t = setInterval(() => setActual(i => (i + 1) % fotos.length), ROTAR_FOTO_MS + Math.random() * 1500);
    return () => clearInterval(t);
  }, [fotos.length]);
  return (
    <>
      {fotos.map((url, i) => (
        <img key={url + i} src={url} alt="" className={`${s.fotoCapa} ${i === actual ? s.fotoActiva : ''}`} loading={i === 0 ? undefined : 'lazy'} />
      ))}
      {fotos.length > 1 && (
        <span className={s.puntos} aria-hidden="true">
          {fotos.map((_, i) => <i key={i} className={i === actual ? s.puntoOn : ''} />)}
        </span>
      )}
    </>
  );
}

const fecha = (iso?: string) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** Tarjeta de proyecto con el diseño de siempre: foto de fondo completa (rota
 *  sola), capa oscura, logo y categoría arriba, datos y botón abajo. */
function Tarjeta({ p, indice, ahora, sesion, logo, empresaNombre }: {
  p: Project; indice: number; destacada?: boolean; ahora: number; sesion: boolean; logo: string | null; empresaNombre?: string;
}) {
  const fotos = (p.imagenes ?? []).map(i => i.url).filter(Boolean);
  const nuevo = p.fecha_creacion && ahora - new Date(p.fecha_creacion).getTime() < DIAS_NUEVO * 864e5;
  const participantes = p.participantes?.length ?? 0;

  return (
    <Link
      // Visitante: el detalle es solo para registrados, la tarjeta lleva a crear cuenta.
      to={sesion ? `/project/${p.id}` : '/register'}
      state={sesion ? { from: 'explore' } : undefined}
      className={s.card}
      style={{ animationDelay: `${0.15 + Math.min(indice, 8) * 0.07}s` }}
      aria-label={sesion ? `${p.nombre}. Ver proyecto completo` : `${p.nombre}. Regístrate para ver más`}
    >
      <span className={s.brillo} aria-hidden="true" />
      <div className={s.cardFondo} aria-hidden="true">
        {fotos.length ? <FotosRotativas fotos={fotos} /> : <Building2 className={s.cardSinFoto} />}
      </div>
      <div className={s.cardVelo} aria-hidden="true" />

      <div className={s.cardContenido}>
        <div className={s.cardArriba}>
          <span className={`${s.cardLogo} ${sesion ? '' : s.borroso}`}>
            {logo ? <img src={logo} alt="" /> : <Building2 size={26} aria-hidden="true" />}
          </span>
          <span className={s.cardEtiquetas}>
            {nuevo && <span className={s.cardNuevo}>Nuevo</span>}
            <span className={s.cardCategoria}>{p.categoria || 'Sin categoría'}</span>
          </span>
        </div>

        <div className={s.cardAbajo}>
          <h2 className={s.cardTitulo}>{p.nombre}</h2>
          {(p.descripcion_corta || p.problema) && <p className={s.cardDesc}>{p.descripcion_corta || p.problema}</p>}
          <div className={`${s.cardChips} ${sesion ? '' : s.borroso}`}>
            <span><Building2 size={14} aria-hidden="true" /> {empresaNombre || 'Empresa'}</span>
            <span><Calendar size={14} aria-hidden="true" /> {fecha(p.fecha_inicio)} – {fecha(p.fecha_fin)}</span>
            <span><Users size={14} aria-hidden="true" /> {participantes} {participantes === 1 ? 'participante' : 'participantes'}</span>
            {p.financiamiento ? <span className={s.cardDinero}><DollarSign size={14} aria-hidden="true" /> {p.financiamiento.toLocaleString('es-BO')}</span> : null}
          </div>
          <span className={s.cardBoton}>
            {sesion ? <>Ver proyecto completo <ArrowRight size={17} /></> : <><Lock size={16} /> Regístrate para ver más</>}
          </span>
        </div>
      </div>
    </Link>
  );
}
