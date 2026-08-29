import { useState, useRef, useEffect } from 'react';
import type { ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import {
  useProyectos,
  useProyectosArchivados,
  useSolicitudesEnviadas,
  useCambiarEstadoProyecto,
  type Project,
  type Request,
} from '@/features/proyectos';
import { useEmpresas } from '@/features/empresas';
import { useUsuarios } from '@/features/usuarios';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { EstadoVacio, EstadoError } from '@/shared/components/feedback';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Avatar } from '@/shared/components/ui/Avatar';
import { ProjectImage } from '@/shared/components/ui/ProjectImage';
import {
  Calendar, Users, DollarSign, Plus, Eye,
  MessageSquare, ChevronDown, Archive, PlayCircle,
  CheckCircle2, RefreshCw, ArchiveRestore, Crown, UserCheck, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabKey = 'activos' | 'terminados' | 'archivados';

const ESTADO_CFG: Record<string, { bg: string; text: string; label: string; icon: ComponentType<{ className?: string }> }> = {
  en_curso:  { bg: 'bg-info-subtle',    text: 'text-info-strong',    label: 'En Curso',  icon: PlayCircle },
  terminado: { bg: 'bg-success-subtle', text: 'text-success-strong', label: 'Terminado', icon: CheckCircle2 },
  archivado: { bg: 'bg-muted',   text: 'text-muted-foreground',   label: 'Archivado', icon: Archive },
};

// ── Portal dropdown (escapes Framer Motion stacking context) ─────────────────
function EstadoDropdown({ projectId, currentEstado, anchorRef, onSelect, onClose }: {
  projectId: number; currentEstado: string;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onSelect: (id: number, e: 'en_curso' | 'terminado' | 'archivado') => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX });
    }
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const opts: { key: 'en_curso' | 'terminado' | 'archivado'; label: string; icon: ComponentType<{ className?: string }>; sep?: boolean }[] = [
    { key: 'en_curso',  label: 'En Curso',         icon: PlayCircle },
    { key: 'terminado', label: 'Terminado',         icon: CheckCircle2 },
    { key: 'archivado', label: 'Archivar proyecto', icon: Archive, sep: true },
  ];

  return createPortal(
    <div style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 'var(--z-index-popover)' }}
      className="bg-card border border-border rounded-xl shadow-2xl min-w-[185px] overflow-hidden">
      {opts.map(o => {
        const Icon = o.icon;
        return (
          <button key={o.key}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onSelect(projectId, o.key); }}
            className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-muted text-sm transition-colors
              ${o.sep ? 'border-t border-border text-muted-foreground' : ''}
              ${o.key === currentEstado ? 'font-semibold text-info-strong bg-info-subtle' : 'text-foreground'}`}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {o.label}
            {o.key === currentEstado && (
              <span className="ml-auto text-[10px] bg-info-subtle text-info-strong px-1.5 py-0.5 rounded-full font-bold">actual</span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

function EstadoBadge({ project, onSelect }: {
  project: Project;
  onSelect: (id: number, e: 'en_curso' | 'terminado' | 'archivado') => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const estado = project.estado || 'en_curso';
  const cfg = ESTADO_CFG[estado] || ESTADO_CFG.en_curso;
  const Icon = cfg.icon;

  return (
    <div className="relative inline-block">
      <button ref={btnRef}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className={`${cfg.bg} ${cfg.text} px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:shadow-md transition-all cursor-pointer`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <EstadoDropdown projectId={project.id} currentEstado={estado} anchorRef={btnRef}
          onSelect={(id, e) => { setOpen(false); onSelect(id, e); }}
          onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

// ── Project card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, isOwner, tab, loadingId, onEstado, requests }: {
  project: Project; isOwner: boolean; tab: TabKey;
  loadingId: number | null;
  onEstado: (id: number, e: 'en_curso' | 'terminado' | 'archivado') => void;
  requests: Request[];
}) {
  const { currentUser } = useApp();
  const { data: users = [] } = useUsuarios(!!currentUser);
  const { data: companies = [] } = useEmpresas();
  const creator = users.find((u) => u.id === project.creador_id);
  const creatorCompany = companies.find((c) => c.id === creator?.empresa_id);
  const pendingReqs = requests.filter((r) => r.proyecto_id === project.id && r.estado === 'pendiente');
  const isLoading = loadingId === project.id;

  const isCollab = project.participantes?.some((pa) => pa.usuario_id === currentUser?.id);
  const estado = project.estado || 'en_curso';
  const estadoCfg = ESTADO_CFG[estado] || ESTADO_CFG.en_curso;
  const EstadoIcon = estadoCfg.icon;
  const teamCount = project.participantes?.length || 0;

  return (
    <Card className={`group relative overflow-hidden h-full min-h-[360px] flex flex-col rounded-2xl border border-white/10 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 ${tab === 'archivados' ? 'grayscale-[0.35]' : ''}`}>
      {/* Fondo: imagen del proyecto a sangre (o relleno oscuro) */}
      <ProjectImage
        imagenes={project.imagenes}
        alt={project.nombre}
        fallback="dark"
        className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105"
      />
      {/* Velo oscuro para legibilidad del texto */}
      <div className="absolute inset-0 z-10 bg-black/55 pointer-events-none" />

      {/* Contenido */}
      <div className="relative z-20 flex flex-col h-full p-5 text-white">
        {/* Superior: rol + categoría / solicitudes */}
        <div className="flex items-start justify-between gap-2">
          <span className="bg-white/15 backdrop-blur-md border border-white/15 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            {isOwner ? <Crown className="w-3.5 h-3.5" /> :
             isCollab ? <UserCheck className="w-3.5 h-3.5" /> :
             <Building2 className="w-3.5 h-3.5" />}
            {isOwner ? 'Propietario' : isCollab ? 'Colaborador' : 'Supervisión'}
          </span>
          <div className="flex flex-col items-end gap-2">
            <span className="bg-white/20 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
              {project.categoria || 'Tecnología'}
            </span>
            {isOwner && pendingReqs.length > 0 && tab === 'activos' && (
              <span className="bg-warning/30 backdrop-blur-md border border-warning/40 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                {pendingReqs.length} SOLICITUDES
              </span>
            )}
          </div>
        </div>

        {/* Inferior: título, descripción, chips y botones */}
        <div className="mt-auto flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-black leading-tight line-clamp-2 drop-shadow-md mb-1">
              {project.nombre}
            </h3>
            <p className="text-white/80 text-xs line-clamp-2 leading-relaxed drop-shadow-sm">
              {project.descripcion_corta || 'Sin descripción corta disponible.'}
            </p>
          </div>

          {/* Etiquetas glassmorphism: fecha, equipo, presupuesto, estado */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-medium text-white/90 shadow-sm">
              <Calendar className="w-3.5 h-3.5" />
              <span>{project.fecha_inicio}{project.fecha_fin ? ` al ${project.fecha_fin}` : ''}</span>
            </span>
            <span className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-medium text-white/90 shadow-sm">
              <Users className="w-3.5 h-3.5" />
              <span>{teamCount} integrante{teamCount === 1 ? '' : 's'}</span>
            </span>
            {project.financiamiento && (
              <span className="bg-success/25 backdrop-blur-md border border-success/40 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-semibold text-[color:var(--green-on-dark)] shadow-sm">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{Number(project.financiamiento).toLocaleString()}</span>
              </span>
            )}
            {isOwner && tab !== 'archivados' ? (
              isLoading ? (
                <span className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-medium text-white/90 shadow-sm">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Actualizando…
                </span>
              ) : (
                <EstadoBadge project={project} onSelect={onEstado} />
              )
            ) : (
              <span className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-semibold text-white/90 shadow-sm">
                <EstadoIcon className="w-3.5 h-3.5" />
                {estadoCfg.label}
              </span>
            )}
          </div>

          {/* Liderado por (proyectos que no son míos) */}
          {!isOwner && (
            <div className="flex items-center gap-2">
              <Avatar
                name={creator?.nombre_completo ?? '?'}
                src={creator?.foto_url}
                className="w-6 h-6 rounded-full text-[10px] border border-white/20"
                fallbackClassName="bg-white/15 text-white font-bold"
              />
              <p className="text-[11px] text-white/70 line-clamp-1">
                Liderado por <span className="font-bold text-white">{creator?.nombre_completo}</span>
                {creatorCompany && <span> · {creatorCompany.nombre}</span>}
              </p>
            </div>
          )}

          {/* Botones */}
          {tab === 'archivados' ? (
            <div className="flex gap-2">
              {isOwner && (
                <button
                  onClick={() => onEstado(project.id, 'en_curso')}
                  disabled={isLoading}
                  className="flex-1 rounded-full bg-success/90 text-white hover:bg-success font-bold py-3 text-[13px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-xl disabled:opacity-50"
                >
                  {isLoading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Procesando…</>
                    : <><ArchiveRestore className="w-4 h-4" /> Reactivar</>}
                </button>
              )}
              <Link to={isLoading ? '#' : `/project/${project.id}`} state={{ from: 'my-projects' }} className={`flex-1 ${isLoading ? 'pointer-events-none' : ''}`}>
                <button className="w-full rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 font-bold py-3 text-[13px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg">
                  <Eye className="w-4 h-4" /> Ver Detalles
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to={isLoading ? '#' : `/grupo-trabajo/${project.id}`} className={`flex-1 ${isLoading ? 'pointer-events-none' : ''}`}>
                <button
                  disabled={isLoading}
                  className="w-full rounded-full bg-background text-foreground hover:bg-muted font-extrabold py-3 text-[13px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-xl disabled:opacity-50"
                >
                  {isLoading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Procesando…</>
                    : <><MessageSquare className="w-4 h-4" /> Grupo de Trabajo</>}
                </button>
              </Link>
              <Link to={isLoading ? '#' : `/project/${project.id}`} state={{ from: 'my-projects' }} className={`flex-1 ${isLoading ? 'pointer-events-none' : ''}`}>
                <button className="w-full rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 font-bold py-3 text-[13px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg">
                  <Eye className="w-4 h-4" /> Detalles
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyProjects() {
  const { currentUser } = useApp();
  const { data: projects = [], isError, refetch } = useProyectos();
  const { data: archivedProjects = [] } = useProyectosArchivados(!!currentUser);
  const { data: requests = [] } = useSolicitudesEnviadas(!!currentUser);
  const cambiarEstado = useCambiarEstadoProyecto();
  const [tab, setTab] = useState<TabKey>('activos');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const myId = currentUser?.id;
  // Crear proyecto es exclusivo del administrador de empresa (o superadmin).
  const puedeCrearProyecto = currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin';

  // Classify projects
  const isMine    = (p: Project) => p.creador_id === myId;
  const isCollab  = (p: Project) => !isMine(p) && p.participantes?.some((pa) => pa.usuario_id === myId);
  const isInvolved = (p: Project) => isMine(p) || isCollab(p);

  const activos    = projects.filter(p => isInvolved(p) && (p.estado || 'en_curso') === 'en_curso');
  const terminados = projects.filter(p => isInvolved(p) && p.estado === 'terminado');
  const archivados = archivedProjects.filter(p => isMine(p)); // collaborators don't see archived

  const displayProjects =
    tab === 'activos'    ? activos :
    tab === 'terminados' ? terminados :
    archivados;

  const handleEstado = async (projectId: number, nuevoEstado: 'en_curso' | 'terminado' | 'archivado') => {
    setLoadingId(projectId);
    try { await cambiarEstado.mutateAsync({ id: projectId, estado: nuevoEstado }); }
    catch (err) { console.error(err); }
    finally { setLoadingId(null); }
  };

  const TABS: { key: TabKey; label: string; icon: ComponentType<{ className?: string }>; count: number; color?: string }[] = [
    { key: 'activos',    label: 'Activos',    icon: PlayCircle,  count: activos.length,    color: 'text-info-strong' },
    { key: 'terminados', label: 'Terminados', icon: CheckCircle2, count: terminados.length, color: 'text-success-strong' },
    { key: 'archivados', label: 'Archivados', icon: Archive,     count: archivados.length, color: 'text-muted-foreground' },
  ];

  return (
    <AppLayout contained mainClassName="flex-1 p-8">
      <Breadcrumbs items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Mis proyectos" }]} />
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Mis Proyectos</h1>
                <p className="text-muted-foreground">Tus proyectos creados y colaboraciones</p>
              </div>
              {puedeCrearProyecto && (
                <Link to="/dashboard/create-project">
                  <Button variant="primary" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />Crear Proyecto
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}>
                  <Icon className={`w-4 h-4 ${active ? '' : t.color}`} />
                  {t.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-card/25 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>{t.count}</span>
                </button>
              );
            })}
          </div>

          {/* Context banners */}
          <AnimatePresence mode="wait">
            {tab === 'terminados' && (
              <motion.div key="terminados-banner"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-6 flex items-center gap-3 px-4 py-3 bg-success-subtle border border-success/30 rounded-xl text-sm text-success-strong">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  Acá se encuentran tus proyectos terminados. Como propietario puedes <strong>reactivarlos</strong> (volver a En Curso) o <strong>archivarlos</strong>; en caso de ser colaborador, podrás seguir consultando sus detalles y acceder al grupo de trabajo.
                </span>
              </motion.div>
            )}
            {tab === 'archivados' && (
              <motion.div key="archivados-banner"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-6 flex items-center gap-3 px-4 py-3 bg-muted border border-border rounded-xl text-sm text-muted-foreground">
                <Archive className="w-4 h-4 flex-shrink-0" />
                <span>
                  Los proyectos archivados <strong>no son visibles al público</strong>. Solo tú como propietario puedes verlos y reactivarlos.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div className="space-y-10">
            {displayProjects.length > 0 ? (
              <>
                {/* Propietario Section */}
                {displayProjects.filter(isMine).length > 0 && (
                  <div id="owned" className="scroll-mt-24">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-info-strong" />
                      Soy Propietario
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        {displayProjects.filter(isMine).length}
                      </span>
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence mode="popLayout">
                        {displayProjects.filter(isMine).map(project => (
                          <motion.div key={project.id} layout
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <ProjectCard
                              project={project}
                              isOwner={true}
                              tab={tab}
                              loadingId={loadingId}
                              onEstado={handleEstado}
                              requests={requests}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Colaborador Section */}
                {displayProjects.filter(isCollab).length > 0 && (
                  <div id="colab" className="scroll-mt-24">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 mt-8">
                      <UserCheck className="w-5 h-5 text-success-strong" />
                      Soy Colaborador
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        {displayProjects.filter(isCollab).length}
                      </span>
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence mode="popLayout">
                        {displayProjects.filter(isCollab).map(project => (
                          <motion.div key={project.id} layout
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <ProjectCard
                              project={project}
                              isOwner={false}
                              tab={tab}
                              loadingId={loadingId}
                              onEstado={handleEstado}
                              requests={requests}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Empty states */}
          {isError ? (
            <EstadoError
              titulo="No pudimos cargar tus proyectos"
              onReintentar={() => refetch()}
            />
          ) : displayProjects.length === 0 && (
            <EstadoVacio
              icono={tab === 'activos' ? PlayCircle : tab === 'terminados' ? CheckCircle2 : Archive}
              titulo={
                tab === 'activos'    ? 'No tienes proyectos activos' :
                tab === 'terminados' ? 'No hay proyectos terminados' :
                'No tienes proyectos archivados'
              }
              descripcion={
                tab === 'activos'    ? 'Crea un proyecto o únete a uno existente para empezar.' :
                tab === 'terminados' ? 'Cuando un proyecto finalice aparecerá aquí.' :
                'Los proyectos que archives aparecerán aquí y solo tú podrás verlos.'
              }
              accion={
                tab === 'activos' ? (
                  <div className="flex gap-3">
                    {puedeCrearProyecto && (
                      <Link to="/dashboard/create-project">
                        <Button variant="primary">Crear Proyecto</Button>
                      </Link>
                    )}
                    <Link to="/explore">
                      <Button variant="outline">Explorar</Button>
                    </Link>
                  </div>
                ) : undefined
              }
            />
          )}
    </AppLayout>
  );
}
