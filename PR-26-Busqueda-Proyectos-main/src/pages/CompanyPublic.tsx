/* ============================================================================
 * src/pages/CompanyPublic.tsx
 * Página pública de una empresa (/empresa/:id). Visible sin sesión.
 * Misma información de siempre (datos públicos, galería, ODS, enlaces y sus
 * proyectos públicos), con el lenguaje del detalle de proyecto:
 *  - Cabecera en 2 columnas: fotos que rotan | logo, nombre, descripción,
 *    acción y cifras. Todo lo esencial en la primera pantalla.
 *  - Abajo: sobre la empresa, galería y proyectos (con la tarjeta de
 *    /explore); a un lado, ODS y enlaces. Los bloques entran al aparecer.
 * ========================================================================= */

import type { CSSProperties } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowDown, ArrowLeft, BadgeCheck, Briefcase, Building2, CalendarCheck, Lock, ArrowRight } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { useEmpresaPublica, type ProyectoDeEmpresa } from '@/features/empresas';
import { Navbar } from '@/shared/components/layout/Navbar';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Galeria } from '@/shared/components/ui/Galeria';
import { EnlaceSocial } from '@/shared/components/ui/EnlaceSocial';
import { ODS_POR_ID, etiquetaOds } from '@/shared/constants/ods';
import { FotosHero, Revelar } from '@/pages/proyecto/piezas';
import s from '@/pages/proyecto/Detalle.module.css';
import t from '@/pages/proyectos/ProyectosPublico.module.css';

export default function CompanyPublic() {
  const { id } = useParams();
  const { currentUser } = useApp();
  const { data: empresa, isLoading, isError } = useEmpresaPublica(id);

  return (
    <div className={s.raiz}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        {currentUser && <Sidebar isAdmin={currentUser.rol === 'superadmin'} />}

        <main id="contenido" tabIndex={-1} style={{ flex: 1, minWidth: 0 }}>
          <div className={s.contenedor}>
            <Link to="/empresas" className={s.volver}><ArrowLeft size={17} /> Todas las empresas</Link>

            {isLoading ? (
              <div className={s.cabecera}>
                <div className={s.hero} style={{ background: 'var(--muted)' }} />
                <div className={s.info} style={{ height: 320, borderRadius: 24, background: 'var(--muted)' }} />
              </div>
            ) : isError || !empresa ? (
              <div className={s.vacio} style={{ padding: '80px 20px' }}>
                <Building2 size={40} style={{ margin: '0 auto 12px', display: 'block' }} aria-hidden="true" />
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--tinta)' }}>Empresa no encontrada</p>
                <p style={{ margin: '6px 0 0' }}>Puede que no exista o que todavía no esté aprobada.</p>
              </div>
            ) : (
              <>
                {/* ── CABECERA: fotos | identidad, acción y cifras ── */}
                <header className={s.cabecera}>
                  <div className={`${s.hero} ${s.aparece}`}>
                    <FotosHero fotos={empresa.imagenes.map(i => i.url)} nombre={empresa.nombre} />
                  </div>

                  <div className={s.info}>
                    <div className={`${s.etiquetas} ${s.aparece}`} style={{ alignItems: 'center', gap: 14 }}>
                      <span className={s.logoGrande}>
                        {empresa.logo_url ? <img src={empresa.logo_url} alt={`Logo de ${empresa.nombre}`} /> : <Building2 size={34} aria-hidden="true" />}
                      </span>
                      <span className={`${s.etiqueta} ${s.etiquetaMarca}`}><BadgeCheck size={15} aria-hidden="true" /> Empresa verificada</span>
                      {empresa.fecha_aprobacion && (
                        <span className={s.etiqueta}><CalendarCheck size={15} aria-hidden="true" /> Desde {new Date(empresa.fecha_aprobacion).getFullYear()}</span>
                      )}
                    </div>
                    <h1 className={s.titulo}>
                      {empresa.nombre.split(' ').map((w, i) => <span key={i} className={s.w} style={{ animationDelay: `${0.15 + i * 0.07}s` }}>{w} </span>)}
                    </h1>
                    {empresa.descripcion && (
                      <p className={`${s.bajada} ${s.aparece} ${s.bajadaCorta}`} style={{ animationDelay: '.45s' }}>{empresa.descripcion}</p>
                    )}
                    {empresa.proyectos.length > 0 && (
                      <div className={`${s.botones} ${s.aparece}`} style={{ animationDelay: '.6s' }}>
                        <a href="#proyectos" className={s.btn}>Ver sus proyectos <ArrowDown size={16} /></a>
                      </div>
                    )}
                    <div className={`${s.cifras} ${s.aparece}`} style={{ animationDelay: '.7s' }}>
                      <div className={s.cifra}><b>{empresa.total_proyectos}</b><span>{empresa.total_proyectos === 1 ? 'proyecto publicado' : 'proyectos publicados'}</span></div>
                      <div className={s.cifra}><b>{empresa.proyectos_activos}</b><span>en curso</span></div>
                      <div className={s.cifra}><b>{empresa.ods.length}</b><span>{empresa.ods.length === 1 ? 'ODS abordado' : 'ODS abordados'}</span></div>
                      <div className={s.cifra}><b>{empresa.num_empleados ?? '—'}</b><span>empleados</span></div>
                    </div>
                  </div>
                </header>

                {/* ── CUERPO: contenido | lateral ── */}
                <div className={s.cuerpo}>
                  <div>
                    <Revelar className={s.bloque}>
                      <p className={s.eyebrow}>Sobre la empresa</p>
                      <p className={s.texto}>{empresa.descripcion || 'Esta empresa todavía no agregó una descripción.'}</p>
                      {empresa.portafolio && (
                        <div className={s.portafolio}>
                          <p className={s.eyebrow} style={{ marginBottom: 8 }}><Briefcase size={15} aria-hidden="true" /> Portafolio</p>
                          <p className={s.texto} style={{ color: 'var(--tinta-2)' }}>{empresa.portafolio}</p>
                        </div>
                      )}
                    </Revelar>

                    {empresa.imagenes.length > 0 && (
                      <Revelar className={s.bloque}>
                        <p className={s.eyebrow}>Galería</p>
                        <Galeria fotos={empresa.imagenes.map((img) => img.url)} nombre={empresa.nombre} />
                      </Revelar>
                    )}

                    <Revelar className={s.bloque} id="proyectos">
                      <p className={s.eyebrow}>Proyectos · {empresa.proyectos.length}</p>
                      {empresa.proyectos.length === 0 ? (
                        <p className={s.vacio}>Esta empresa todavía no tiene proyectos públicos.</p>
                      ) : (
                        <div className={s.proyectos}>
                          {empresa.proyectos.map((p, i) => <TarjetaProyecto key={p.id} proyecto={p} visitante={!currentUser} indice={i} />)}
                        </div>
                      )}
                    </Revelar>
                  </div>

                  <aside className={s.ficha}>
                    <Revelar className={s.panel}>
                      <h3>Objetivos de Desarrollo Sostenible</h3>
                      {empresa.ods.length === 0 ? (
                        <p style={{ margin: 0, color: 'var(--tinta-2)', fontSize: '.92rem' }}>Sus proyectos aún no declaran ODS.</p>
                      ) : (
                        <div className={s.odsLista}>
                          {empresa.ods.map(({ ods, proyectos }) => {
                            const o = ODS_POR_ID[ods];
                            return (
                              <Link key={ods} to={`/explore?ods=${ods}`} className={s.odsCard} title={etiquetaOds(ods)} style={{ '--c': o?.color } as CSSProperties}>
                                <img src={`/images/ods/${ods}.png`} alt="" />
                                <div><b>{proyectos} {proyectos === 1 ? 'proyecto' : 'proyectos'}</b><span>{o?.nombre ?? etiquetaOds(ods)}</span></div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </Revelar>

                    {empresa.enlaces.length > 0 && (
                      <Revelar className={s.panel} retraso={0.1}>
                        <h3>Redes y enlaces</h3>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {empresa.enlaces.map((l, i) => <EnlaceSocial key={l.id ?? i} url={l.url} nombre={l.nombre} />)}
                        </div>
                      </Revelar>
                    )}
                  </aside>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/** Tarjeta de proyecto con el mismo diseño de /explore. El visitante sin
 *  sesión ve la tarjeta, pero el detalle lo lleva a registrarse. */
function TarjetaProyecto({ proyecto: p, visitante, indice }: { proyecto: ProyectoDeEmpresa; visitante: boolean; indice: number }) {
  const enCurso = p.estado === 'en_curso';
  return (
    <Link to={visitante ? '/register' : `/project/${p.id}`} className={t.card} style={{ height: 420, animationDelay: `${0.1 + Math.min(indice, 6) * 0.07}s` }}
      aria-label={visitante ? `${p.nombre}. Regístrate para ver más` : `${p.nombre}. Ver proyecto`}>
      <span className={t.brillo} aria-hidden="true" />
      <div className={t.cardFondo} aria-hidden="true">
        {p.imagen_url ? <img src={p.imagen_url} alt="" className={`${t.fotoCapa} ${t.fotoActiva}`} /> : <Building2 className={t.cardSinFoto} />}
      </div>
      <div className={t.cardVelo} aria-hidden="true" />
      <div className={t.cardContenido}>
        <div className={t.cardArriba}>
          <span />
          <span className={t.cardEtiquetas}>
            <span className={enCurso ? t.cardNuevo : t.cardCategoria}>{enCurso ? 'En curso' : 'Terminado'}</span>
          </span>
        </div>
        <div className={t.cardAbajo}>
          <h3 className={t.cardTitulo}>{p.nombre}</h3>
          {p.descripcion_corta && <p className={t.cardDesc}>{p.descripcion_corta}</p>}
          {p.ods.length > 0 && (
            <div className={t.cardChips}>
              {p.ods.map(id => <span key={id} title={etiquetaOds(id)}>ODS {id}</span>)}
            </div>
          )}
          <span className={t.cardBoton}>
            {visitante ? <><Lock size={16} /> Regístrate para ver más</> : <>Ver proyecto <ArrowRight size={17} /></>}
          </span>
        </div>
      </div>
    </Link>
  );
}
