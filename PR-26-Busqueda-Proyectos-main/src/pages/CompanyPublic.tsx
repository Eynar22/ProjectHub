/* ============================================================================
 * src/pages/CompanyPublic.tsx
 * Página pública de una empresa (/empresa/:id). Visible sin sesión: datos
 * públicos, galería de fotos, ODS que trabaja y sus proyectos públicos.
 * ========================================================================= */

import { Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft, Lock, Building2, FolderKanban, Activity, Target, Users, Briefcase, CalendarCheck, ChevronRight,
} from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { useEmpresaPublica, type ProyectoDeEmpresa } from '@/features/empresas';
import { Navbar } from '@/shared/components/layout/Navbar';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Galeria } from '@/shared/components/ui/Galeria';
import { EnlaceSocial } from '@/shared/components/ui/EnlaceSocial';
import { ODS_POR_ID, etiquetaOds } from '@/shared/constants/ods';

export default function CompanyPublic() {
  const { id } = useParams();
  const { currentUser } = useApp();
  const { data: empresa, isLoading, isError } = useEmpresaPublica(id);

  return (
    <div className="min-h-screen text-foreground font-sans relative overflow-x-clip">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/5 pointer-events-none -z-10" />
      <Navbar />

      <div className="flex relative z-10">
        {currentUser && <Sidebar isAdmin={currentUser.rol === 'superadmin'} />}

        <main id="contenido" tabIndex={-1} className="flex-1 w-full min-w-0 overflow-x-clip">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <Link to="/empresas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 rounded focus-visible:ring-2 focus-visible:ring-ring">
              <ArrowLeft className="w-4 h-4" /> Todas las empresas
            </Link>

            {isLoading ? (
              <div className="space-y-6">
                <div className="h-64 rounded-3xl bg-muted animate-pulse" />
                <div className="h-40 rounded-3xl bg-muted animate-pulse" />
              </div>
            ) : isError || !empresa ? (
              <div className="text-center py-20 border border-dashed border-border rounded-3xl">
                <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold">Empresa no encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">Puede que no exista o que todavía no esté aprobada.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

                {/* Cabecera */}
                <section className="rounded-3xl overflow-hidden border border-border/60 bg-card shadow-sm">
                  <div className="relative h-40 md:h-56 bg-primary/10">
                    {empresa.imagenes[0] && <img src={empresa.imagenes[0].url} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-4">
                      <div className="-mt-12 w-24 h-24 rounded-3xl bg-muted border-4 border-card shadow-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                        {empresa.logo_url
                          ? <img src={empresa.logo_url} alt={`Logo de ${empresa.nombre}`} className="w-full h-full object-cover" />
                          : <Building2 className="w-10 h-10 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 pt-1 sm:pt-4">
                        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight break-words">{empresa.nombre}</h1>
                        {empresa.fecha_aprobacion && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                            <CalendarCheck className="w-4 h-4" /> En la plataforma desde {new Date(empresa.fecha_aprobacion).getFullYear()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                      <Stat icono={FolderKanban} valor={empresa.total_proyectos} etiqueta="Proyectos" />
                      <Stat icono={Activity} valor={empresa.proyectos_activos} etiqueta="En curso" />
                      <Stat icono={Target} valor={empresa.ods.length} etiqueta="ODS abordados" />
                      {empresa.num_empleados ? <Stat icono={Users} valor={empresa.num_empleados} etiqueta="Empleados" /> : null}
                    </div>
                  </div>
                </section>

                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Columna principal */}
                  <div className="lg:col-span-2 space-y-8">
                    <Seccion titulo="Sobre la empresa">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {empresa.descripcion || 'Esta empresa todavía no agregó una descripción.'}
                      </p>
                      {empresa.portafolio && (
                        <div className="mt-5 rounded-2xl bg-muted/60 p-4">
                          <p className="text-sm font-semibold flex items-center gap-2 mb-1"><Briefcase className="w-4 h-4 text-primary" /> Portafolio</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{empresa.portafolio}</p>
                        </div>
                      )}
                    </Seccion>

                    {empresa.imagenes.length > 0 && (
                      <Seccion titulo="Galería">
                        <Galeria fotos={empresa.imagenes.map((img) => img.url)} nombre={empresa.nombre} />
                      </Seccion>
                    )}

                    <Seccion titulo={`Proyectos (${empresa.proyectos.length})`}>
                      {empresa.proyectos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Esta empresa todavía no tiene proyectos públicos.</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {empresa.proyectos.map((p) => <TarjetaProyecto key={p.id} proyecto={p} visitante={!currentUser} />)}
                        </div>
                      )}
                    </Seccion>
                  </div>

                  {/* Columna lateral */}
                  <aside className="space-y-8">
                    <Seccion titulo="Objetivos de Desarrollo Sostenible">
                      {empresa.ods.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sus proyectos aún no declaran ODS.</p>
                      ) : (
                        <ul className="space-y-2">
                          {empresa.ods.map(({ ods, proyectos }) => {
                            const o = ODS_POR_ID[ods];
                            return (
                              <li key={ods}>
                                <Link to={`/explore?ods=${ods}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted transition-colors">
                                  <span className="w-10 h-10 rounded-lg text-sm font-extrabold text-white flex items-center justify-center flex-shrink-0" style={{ backgroundColor: o?.color }}>
                                    {ods}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold leading-tight">{o?.nombre ?? etiquetaOds(ods)}</span>
                                    <span className="block text-xs text-muted-foreground">{proyectos} {proyectos === 1 ? 'proyecto' : 'proyectos'}</span>
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </Seccion>

                    {empresa.enlaces.length > 0 && (
                      <Seccion titulo="Redes y enlaces">
                        <div className="space-y-2">
                          {empresa.enlaces.map((l, i) => <EnlaceSocial key={l.id ?? i} url={l.url} nombre={l.nombre} />)}
                        </div>
                      </Seccion>
                    )}
                  </aside>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>

    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4">{titulo}</h2>
      {children}
    </section>
  );
}

function Stat({ icono: Icono, valor, etiqueta }: { icono: typeof Target; valor: number; etiqueta: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4 flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Icono className="w-5 h-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xl font-extrabold leading-none">{valor}</span>
        <span className="block text-xs text-muted-foreground mt-1">{etiqueta}</span>
      </span>
    </div>
  );
}

/** El visitante sin sesión ve la tarjeta, pero el detalle lo lleva a registrarse (igual que en Explorar). */
function TarjetaProyecto({ proyecto: p, visitante }: { proyecto: ProyectoDeEmpresa; visitante: boolean }) {
  return (
    <Link to={visitante ? '/register' : `/project/${p.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border/60 bg-background hover:shadow-lg transition-shadow focus-visible:ring-2 focus-visible:ring-ring outline-none">
      <div className="relative aspect-video bg-primary/10">
        {p.imagen_url
          ? <img src={p.imagen_url} alt="" className="w-full h-full object-cover" />
          : <FolderKanban className="absolute inset-0 m-auto w-8 h-8 text-primary/40" />}
        <span className={`absolute top-2 right-2 text-[11px] font-bold px-2 py-1 rounded-full ${p.estado === 'en_curso' ? 'bg-success text-white' : 'bg-black/60 text-white'}`}>
          {p.estado === 'en_curso' ? 'En curso' : 'Terminado'}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold leading-tight line-clamp-2">{p.nombre}</h3>
        {p.descripcion_corta && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.descripcion_corta}</p>}
        {p.ods.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {p.ods.map((id) => (
              <span key={id} title={etiquetaOds(id)} className="w-6 h-6 rounded text-[10px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: ODS_POR_ID[id]?.color }}>{id}</span>
            ))}
          </div>
        )}
        <span className="mt-auto pt-3 text-sm font-semibold text-primary flex items-center gap-1">
          {visitante
            ? <><Lock className="w-4 h-4" /> Regístrate para ver más</>
            : <>Ver proyecto <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
        </span>
      </div>
    </Link>
  );
}
