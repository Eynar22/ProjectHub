/* ============================================================================
 * src/pages/empresas/EmpresasPublico.tsx
 * Directorio de empresas (/empresas). Una sola versión para todos; con sesión
 * va dentro del panel, junto a la barra lateral.
 * Misma información que antes: empresas aprobadas, sus conteos de proyectos
 * y los ODS que trabajan; búsqueda y filtro por ODS en la URL (?ods=6).
 * ========================================================================= */

import { useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Activity, ChevronRight, FolderKanban, Search, Target } from 'lucide-react';
import { LIMITES } from '@/shared/validacion';
import { useEmpresasPublicas, type EmpresaPublica } from '@/features/empresas';
import { ODS_LIST, ODS_POR_ID, etiquetaOds } from '@/shared/constants/ods';
import { useApp } from '@/app/context/AppContext';
import { Navbar } from '@/shared/components/layout/Navbar';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import s from './EmpresasPublico.module.css';

function Palabras({ texto, retraso = 0 }: { texto: string; retraso?: number }) {
  return <>{texto.split(' ').map((w, i) => <span key={i} className={s.w} style={{ animationDelay: `${retraso + i * 0.06}s` }}>{w} </span>)}</>;
}

export default function EmpresasPublico() {
  const { currentUser } = useApp();
  const sesion = !!currentUser;
  const { data: empresas = [], isLoading, isError } = useEmpresasPublicas();
  const [busqueda, setBusqueda] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const odsParam = Number(searchParams.get('ods'));
  const odsFiltro = ODS_POR_ID[odsParam] ? odsParam : null;
  const elegirOds = (id: number | null) => {
    const sig = new URLSearchParams(searchParams);
    if (id) sig.set('ods', String(id)); else sig.delete('ods');
    setSearchParams(sig, { replace: true });
  };

  const texto = busqueda.trim().toLowerCase();
  const filtradas = empresas.filter(e =>
    (!texto || e.nombre.toLowerCase().includes(texto) || e.descripcion?.toLowerCase().includes(texto)) &&
    (!odsFiltro || e.ods.includes(odsFiltro)),
  );
  const odsPresentes = ODS_LIST.filter(o => empresas.some(e => e.ods.includes(o.id)));
  const totalProyectos = empresas.reduce((n, e) => n + e.total_proyectos, 0);
  const totalOds = new Set(empresas.flatMap(e => e.ods)).size;
  const hayFiltro = !!texto || !!odsFiltro;

  const contenido = (
    <>
      <header className={s.cabecera}>
        <div>
          <p className={`${s.eyebrow} ${s.aparece}`}>Empresas</p>
          <h1 className={s.titulo}><Palabras texto="Las organizaciones que ya están resolviendo problemas reales." retraso={0.1} /></h1>
        </div>
        <div className={`${s.cifras} ${s.aparece}`} style={{ animationDelay: '.5s' }}>
          <div className={s.cifra}><b>{empresas.length}</b><span>{empresas.length === 1 ? 'empresa verificada' : 'empresas verificadas'}</span></div>
          <div className={s.cifra}><b>{totalProyectos}</b><span>{totalProyectos === 1 ? 'proyecto publicado' : 'proyectos publicados'}</span></div>
          <div className={s.cifra}><b>{totalOds}</b><span>ODS abordados</span></div>
        </div>
      </header>

      <div className={s.barra}>
        <label className={s.buscador}>
          <Search size={19} aria-hidden="true" />
          <input
            type="text" aria-label="Buscar empresas" placeholder="Buscar por nombre o descripción…"
            value={busqueda} maxLength={LIMITES.busqueda} onChange={e => setBusqueda(e.target.value)}
          />
        </label>
        {odsPresentes.length > 0 && (
          <div className={s.filtros} role="group" aria-label="Filtrar por ODS">
            <small>ODS:</small>
            {odsPresentes.map(o => {
              const on = odsFiltro === o.id;
              return (
                <button
                  key={o.id} type="button" title={etiquetaOds(o.id)} aria-label={etiquetaOds(o.id)} aria-pressed={on}
                  className={`${s.ods} ${on ? s.odsOn : ''}`} style={{ '--c': o.color } as CSSProperties}
                  onClick={() => elegirOds(on ? null : o.id)}
                >
                  <img src={`/images/ods/${o.id}.png`} alt="" />
                </button>
              );
            })}
            {odsFiltro && <button type="button" className={s.quitar} onClick={() => elegirOds(null)}>Quitar filtro</button>}
          </div>
        )}
        {hayFiltro && !isLoading && (
          <p className={s.resultado} aria-live="polite">
            {filtradas.length} {filtradas.length === 1 ? 'empresa' : 'empresas'}
            {odsFiltro ? <> con proyectos en <b>{etiquetaOds(odsFiltro)}</b></> : null}
          </p>
        )}
      </div>

      <div className={s.lista}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className={s.cargando} />)
        ) : isError ? (
          <p className={s.vacio}>No se pudieron cargar las empresas. Intenta de nuevo en unos minutos.</p>
        ) : filtradas.length === 0 ? (
          <p className={s.vacio}>{empresas.length === 0 ? 'Todavía no hay empresas registradas.' : 'Ninguna empresa coincide con la búsqueda.'}</p>
        ) : (
          filtradas.map((e, i) => <Tarjeta key={e.id} empresa={e} indice={i} />)
        )}
      </div>

      {!sesion && (
      <section className={s.cierre}>
        <h2>¿Tu empresa tiene un problema que resolver?</h2>
        <Link to="/register" className={s.btn}>Registrar mi empresa</Link>
      </section>
      )}
    </>
  );

  return (
    <div className={s.raiz}>
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

const COLORES_TARJETA = ['var(--guinda-600)', 'var(--gray-600)', 'var(--guinda-400)'];

function Tarjeta({ empresa: e, indice }: { empresa: EmpresaPublica; indice: number }) {
  const MAX_ODS = 6;
  // Color de acento de la tarjeta: rota entre los colores de la paleta oficial.
  const color = COLORES_TARJETA[indice % COLORES_TARJETA.length];
  const inicial = e.nombre.trim().charAt(0).toUpperCase();
  return (
    <Link to={`/empresa/${e.id}`} className={s.tarjeta} style={{ '--c': color, animationDelay: `${0.2 + Math.min(indice, 8) * 0.08}s` } as CSSProperties}>
      <div className={s.portada}>
        {e.portada_url
          ? <img src={e.portada_url} alt="" className={s.foto} />
          : <span className={s.sinFoto} aria-hidden="true">{inicial}</span>}
      </div>
      <div className={s.logo}>
        {e.logo_url ? <img src={e.logo_url} alt={`Logo de ${e.nombre}`} /> : <span aria-hidden="true">{inicial}</span>}
      </div>
      <div className={s.cuerpo}>
        <h2 className={s.nombre}>{e.nombre}</h2>
        <p className={s.desc}>{e.descripcion || 'Sin descripción.'}</p>
        <div className={s.datos}>
          <span><FolderKanban size={17} aria-hidden="true" /><b>{e.total_proyectos}</b>Proyectos</span>
          <span><Activity size={17} aria-hidden="true" /><b>{e.proyectos_activos}</b>Activos</span>
          <span><Target size={17} aria-hidden="true" /><b>{e.ods.length}</b>ODS</span>
        </div>
        {e.ods.length > 0 && (
          <div className={s.odsFila}>
            {e.ods.slice(0, MAX_ODS).map(id => (
              <span key={id} className={s.odsChip} title={etiquetaOds(id)} style={{ '--c': ODS_POR_ID[id]?.color } as CSSProperties}>{id}</span>
            ))}
            {e.ods.length > MAX_ODS && <span className={s.odsMas}>+{e.ods.length - MAX_ODS}</span>}
          </div>
        )}
        <span className={s.pie}>Ver empresa <ChevronRight size={18} aria-hidden="true" /></span>
      </div>
    </Link>
  );
}
