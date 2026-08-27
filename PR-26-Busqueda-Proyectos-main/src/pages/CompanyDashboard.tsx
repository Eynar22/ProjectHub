import { Link } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useEmpresas } from '@/features/empresas';
import { solicitudesService } from '@/features/proyectos';
import { useSolicitudesMembresia, useResponderSolicitudMembresia } from '@/features/usuarios';
import { Navbar } from '@/shared/components/layout/Navbar';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { OnboardingWizard } from '@/shared/components/OnboardingWizard';
import {
  FolderKanban,
  Plus,
  Users,
  Calendar,
  Building2,
  Search,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  FileText,
  Briefcase,
  Mail,
  ExternalLink,
  X,
  ShieldCheck,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { MemberRequest } from '@/app/context/AppContext';

interface ProjectPendingGroup {
  proyecto_id: number;
  proyecto_nombre: string;
  solicitudes: Array<{
    id: number;
    mensaje: string;
    fecha_creacion: string;
    usuario?: { id: number; nombre_completo: string; correo: string; cargo?: string };
  }>;
}

export default function CompanyDashboard() {
  const { currentUser, users, projects, openBase64 } = useApp();
  const { data: companies = [] } = useEmpresas();
  const esAdmin = currentUser?.rol === 'admin';
  const { data: memberRequests = [] } = useSolicitudesMembresia(currentUser?.empresa_id, esAdmin);
  const responderSolicitud = useResponderSolicitudMembresia();
  const approveMemberRequest = (id: number) => responderSolicitud.mutate({ solicitudId: id, accion: 'aprobar' });
  const rejectMemberRequest = (id: number) => responderSolicitud.mutate({ solicitudId: id, accion: 'rechazar' });
  const navigate = useNavigate();
  const [detailRequest, setDetailRequest] = useState<MemberRequest | null>(null);
  const [projectPendingGroups, setProjectPendingGroups] = useState<ProjectPendingGroup[]>([]);

  useEffect(() => {
    if (currentUser?.rol === 'superadmin') navigate('/admin');
  }, [currentUser, navigate]);

  // Solicitudes de participación pendientes en mis proyectos, agrupadas.
  useEffect(() => {
    if (!currentUser) return;
    solicitudesService.listarPendientesAgrupadas<ProjectPendingGroup>()
      .then(data => setProjectPendingGroups(Array.isArray(data) ? data : []))
      .catch(() => setProjectPendingGroups([]));
  }, [currentUser?.id]);

  const totalProjectPending = projectPendingGroups.reduce((sum, g) => sum + g.solicitudes.length, 0);

  const userCompany = companies.find(c => c.id === currentUser?.empresa_id);
  const myProjects = projects.filter(p => p.creador_id === currentUser?.id);
  const collaboratingProjects = projects.filter(p =>
    p.participantes?.some(part => part.usuario_id === currentUser?.id) &&
    p.creador_id !== currentUser?.id
  );

  // Solicitudes de membresía pendientes (para admin de empresa)
  const pendingMembers = memberRequests.filter(
    mr => mr.empresa_id === currentUser?.empresa_id && mr.estado === 'pendiente'
  );

  const stats = [
    {
      label: 'Mis Proyectos',
      value: myProjects.length,
      subtext: 'Proyectos creados por ti',
      icon: FolderKanban,
      color: 'from-primary to-secondary',
      link: '/dashboard/projects#owned',
    },
    {
      label: 'Colaboraciones',
      value: collaboratingProjects.length,
      subtext: 'Proyectos en los que participas',
      icon: Users,
      color: 'from-success to-success',
      link: '/dashboard/projects#colab',
    },
    {
      label: 'Solicitudes de Proyectos',
      value: totalProjectPending,
      subtext: totalProjectPending > 0 ? 'Nuevas solicitudes pendientes' : 'Sin solicitudes pendientes',
      icon: UserPlus,
      color: totalProjectPending > 0 ? 'from-primary to-primary' : 'from-muted to-muted',
      link: '#project-requests-section',
      pulse: totalProjectPending > 0,
    },
    ...(currentUser?.rol === 'admin'
      ? [{
        label: 'Solicitudes Miembros',
        value: pendingMembers.length,
        subtext: pendingMembers.length > 0 ? 'Nuevos miembros esperando' : 'No hay solicitudes nuevas',
        icon: Clock,
        color: pendingMembers.length > 0 ? 'from-warning to-warning' : 'from-muted to-muted',
        link: '/dashboard/members',
        pulse: pendingMembers.length > 0,
      }]
      : []),
  ];

  const isCompanyAdmin = currentUser?.rol === 'admin' && !!userCompany;

  return (
    <div className="min-h-screen">
      {isCompanyAdmin && currentUser && !currentUser.onboarding_completado && <OnboardingWizard />}
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main id="contenido" tabIndex={-1} className="flex-1 py-8 px-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground text-xl font-black flex-shrink-0">
                  {currentUser?.nombre_completo?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Bienvenido de vuelta</p>
                  <h1 className="text-2xl font-black tracking-tight">{currentUser?.nombre_completo}</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {userCompany && <><Building2 className="w-3 h-3" /><span className="font-medium text-primary">{userCompany.nombre}</span></>}
                    {currentUser?.cargo && <><span>·</span><span>{currentUser.cargo}</span></>}
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <Link to="/dashboard/create-project">
                  <Button variant="primary" className="flex items-center gap-2 shadow-md shadow-primary/20">
                    <Plus className="w-4 h-4" />
                    Nuevo Proyecto
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Explorar
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className={`grid gap-6 mb-8 ${currentUser?.rol === 'admin' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const hasPulse = (stat as any).pulse;

              const cardContent = (
                <Card hover className="p-6 transition-all border-none shadow-sm h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md relative`}>
                      <Icon className="w-6 h-6 text-primary-foreground" />
                      {hasPulse && stat.value > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-background animate-bounce shadow-lg">
                          {stat.value}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-black tracking-tight mb-1 tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{stat.subtext}</p>
                  </div>
                </Card>
              );

              return (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
                  {stat.link?.startsWith('#') ? (
                    <button
                      type="button"
                      className="h-full w-full text-left"
                      onClick={() =>
                        document
                          .getElementById(stat.link!.substring(1))
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }
                    >
                      {cardContent}
                    </button>
                  ) : stat.link ? (
                    <Link to={stat.link} className="h-full block">
                      {cardContent}
                    </Link>
                  ) : (
                    <div className="h-full block">
                      {cardContent}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Quick Actions — mobile only (desktop buttons in header) */}
          <div className="md:hidden grid grid-cols-2 gap-4 mb-8">
            <Link to="/dashboard/create-project">
              <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-md transition-all cursor-pointer">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-3 shadow-md shadow-primary/20">
                  <Plus className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="font-bold text-sm">Nuevo Proyecto</p>
                <p className="text-xs text-muted-foreground mt-0.5">Publica y encuentra colaboradores</p>
              </Card>
            </Link>
            <Link to="/explore">
              <Card className="p-5 bg-gradient-to-br from-accent/10 to-success/5 border-accent/20 hover:shadow-md transition-all cursor-pointer">
                <div className="w-9 h-9 bg-gradient-to-br from-muted to-muted rounded-xl flex items-center justify-center mb-3 shadow-md">
                  <Search className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="font-bold text-sm">Explorar</p>
                <p className="text-xs text-muted-foreground mt-0.5">Descubre colaboraciones</p>
              </Card>
            </Link>
          </div>

          {/* My Projects */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Mis Proyectos</h2>
                <p className="text-xs text-muted-foreground">{myProjects.length} proyecto(s) creado(s)</p>
              </div>
              <Link to="/dashboard/projects">
                <Button variant="ghost" className="flex items-center gap-1.5 text-sm">
                  Ver todos <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {myProjects.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProjects.slice(0, 3).map((project) => {
                  const statusCfg = {
                    en_curso: { label: 'En Curso', cls: 'bg-info-subtle text-info-strong border-info/30' },
                    terminado: { label: 'Terminado', cls: 'bg-success-subtle text-success-strong border-success/30' },
                    archivado: { label: 'Archivado', cls: 'bg-muted text-muted-foreground border-border' },
                  }[project.estado] || { label: project.estado, cls: 'bg-muted text-muted-foreground' };
                  return (
                    <Card key={project.id} hover className="p-5 border-none shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
                          <FolderKanban className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {project.categoria || 'Tecnología'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-bold mb-1.5 line-clamp-1">{project.nombre}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.descripcion_corta}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{project.fecha_inicio}</span>
                      </div>
                      <Link to={`/grupo-trabajo/${project.id}`}>
                        <Button variant="outline" size="sm" className="w-full text-xs">Ver Grupo de Trabajo</Button>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-10 text-center border-none shadow-sm border-dashed">
                <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="w-7 h-7 text-primary/40" />
                </div>
                <h3 className="font-bold mb-1">Aún no tienes proyectos</h3>
                <p className="text-muted-foreground text-sm mb-5">Crea tu primer proyecto para empezar a colaborar</p>
                <Link to="/dashboard/create-project">
                  <Button variant="primary" className="shadow-md shadow-primary/20">Crear Proyecto</Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Collaborating Projects */}
          {collaboratingProjects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Proyectos en Colaboración</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaboratingProjects.slice(0, 3).map((project) => {
                  const creator = users.find(u => u.id === project.creador_id);
                  const creatorCompany = companies.find(c => c.id === creator?.empresa_id);
                  return (
                    <Card key={project.id} hover className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {creatorCompany?.logo_url ? (
                          <img src={creatorCompany.logo_url} alt={creatorCompany.nombre} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-muted to-muted rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{project.nombre}</h3>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                              {project.categoria || 'Tecnología'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            por {creator?.nombre_completo}{creatorCompany ? ` · ${creatorCompany.nombre}` : ''}
                          </p>
                        </div>
                      </div>
                      <Link to={`/grupo-trabajo/${project.id}`}>
                        <Button variant="outline" size="sm" className="w-full">Ver Grupo de Trabajo</Button>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Pending Member Requests — only for company admin ── */}
          {currentUser?.rol === 'admin' && pendingMembers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  Solicitudes de Miembros Pendientes
                  <span className="ml-1 px-2.5 py-0.5 bg-warning/15 text-warning text-sm rounded-full font-semibold border border-warning/20 animate-pulse">
                    {pendingMembers.length}
                  </span>
                </h2>
                <Link to="/dashboard/members">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    Ver todo <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {pendingMembers.slice(0, 3).map(mr => (
                  <motion.div key={mr.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="p-5 border-l-4 border-l-warning hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        {/* Avatar + Info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0 shadow-md">
                            {mr.usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base">{mr.usuario?.nombre_completo}</p>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{mr.usuario?.correo}</span>
                            </div>
                            {mr.usuario?.cargo && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Briefcase className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                                  {mr.usuario.cargo}
                                </span>
                              </div>
                            )}
                            {mr.documento_url && (
                              <button
                                onClick={() => openBase64(mr.documento_url!)}
                                className="flex items-center gap-1.5 mt-2 text-xs text-secondary hover:text-primary font-medium transition-colors group"
                              >
                                <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                <ExternalLink className="w-3 h-3" />
                                Ver Documento Adjunto
                              </button>
                            )}
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Solicitado el {new Date(mr.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 text-xs"
                            onClick={() => setDetailRequest(mr)}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Ver Detalles
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex items-center gap-1.5 text-xs"
                            onClick={() => approveMemberRequest(mr.id)}
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Aprobar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 text-xs text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => rejectMemberRequest(mr.id)}
                          >
                            <UserX className="w-3.5 h-3.5" /> Rechazar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}

                {pendingMembers.length > 3 && (
                  <Link to="/dashboard/members">
                    <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer border-dashed">
                      <p className="text-sm text-muted-foreground">
                        +{pendingMembers.length - 3} solicitudes más — <span className="text-primary font-medium">Ver todas</span>
                      </p>
                    </Card>
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Project Join Requests Section ── */}
          {projectPendingGroups.length > 0 && (
            <motion.div
              id="project-requests-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-info-strong" />
                  Solicitudes de Participación — Mis Proyectos
                  <span className="ml-1 px-2.5 py-0.5 bg-info-subtle text-info-strong text-sm rounded-full font-semibold border border-info/30">
                    {totalProjectPending}
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                {projectPendingGroups.map((group, gi) => (
                  <motion.div key={group.proyecto_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: gi * 0.07 }}>
                    <Card className="p-0 border-none shadow-sm overflow-hidden">
                      {/* Project header bar */}
                      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60 bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
                            <FolderKanban className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="font-bold text-base">{group.proyecto_nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {group.solicitudes.length} solicitud{group.solicitudes.length > 1 ? 'es' : ''} pendiente{group.solicitudes.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Link to={`/grupo-trabajo/${group.proyecto_id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs border-info/40 text-info-strong hover:bg-info/10">
                            <UserPlus className="w-3.5 h-3.5" /> Gestionar
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>

                      {/* Solicitudes list */}
                      <div className="divide-y divide-border/40">
                        {group.solicitudes.slice(0, 3).map((sol) => (
                          <div key={sol.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                              {sol.usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{sol.usuario?.nombre_completo}</p>
                                {sol.usuario?.cargo && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                                    {sol.usuario.cargo}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{sol.usuario?.correo}</span>
                              </div>
                              {sol.mensaje && (
                                <p className="text-xs text-muted-foreground italic mt-1 truncate">"{sol.mensaje}"</p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(sol.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </div>
                          </div>
                        ))}
                        {group.solicitudes.length > 3 && (
                          <div className="px-6 py-3 text-center bg-muted/10">
                            <span className="text-xs text-muted-foreground">
                              +{group.solicitudes.length - 3} solicitud{group.solicitudes.length - 3 > 1 ? 'es' : ''} más —{' '}
                              <Link to={`/grupo-trabajo/${group.proyecto_id}`} className="text-info-strong font-medium hover:underline">
                                gestionar en el proyecto
                              </Link>
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {detailRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-modal p-4"
            onClick={() => setDetailRequest(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <Card className="border-none shadow-2xl overflow-hidden">
                {/* Modal header */}
                <div className="relative p-6 bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-b border-border">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Solicitud de Membresía</h2>
                      <p className="text-muted-foreground text-sm mt-0.5">Revisión completa del solicitante</p>
                    </div>
                    <button
                      onClick={() => setDetailRequest(null)}
                      className="p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Datos personales */}
                    <div>
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Datos Personales</h3>
                      <div className="space-y-4">
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-warning to-warning rounded-2xl flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg">
                            {detailRequest.usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="font-bold text-lg leading-tight">{detailRequest.usuario?.nombre_completo}</p>
                            <span className="text-xs px-2 py-0.5 bg-warning/10 text-warning rounded-full font-medium border border-warning/20">
                              Pendiente de Aprobación
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                              <p className="text-sm font-semibold">{detailRequest.usuario?.correo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                            <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Cargo en la Empresa</p>
                              <p className="text-sm font-semibold">{detailRequest.usuario?.cargo || 'No especificado'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Fecha de Solicitud</p>
                              <p className="text-sm font-semibold">
                                {new Date(detailRequest.fecha_creacion).toLocaleDateString('es-ES', {
                                  day: '2-digit', month: 'long', year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Documentación */}
                    <div>
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Documentación</h3>
                      {detailRequest.documento_url ? (
                        <div
                          onClick={() => openBase64(detailRequest.documento_url!)}
                          className="group p-5 bg-muted/50 rounded-2xl border border-border hover:border-primary/50 hover:bg-background transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-background rounded-xl shadow-sm border border-border text-primary group-hover:scale-110 transition-transform">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-tight">
                              DOC
                            </div>
                          </div>
                          <h4 className="font-bold mb-1">Documento de Pertenencia</h4>
                          <p className="text-xs text-muted-foreground mb-4">Carta, contrato o carnet adjunto por el solicitante</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase group-hover:underline">
                            <ExternalLink className="w-3 h-3" />
                            VER DOCUMENTO
                          </div>
                        </div>
                      ) : (
                        <div className="p-5 bg-muted/30 rounded-2xl border border-dashed border-border text-center">
                          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No se adjuntó documentación</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      variant="primary"
                      className="flex-1 flex items-center justify-center gap-2 py-5 font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
                      onClick={() => { approveMemberRequest(detailRequest.id); setDetailRequest(null); }}
                    >
                      <UserCheck className="w-5 h-5" /> Aprobar Solicitud
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2 py-5 text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => { rejectMemberRequest(detailRequest.id); setDetailRequest(null); }}
                    >
                      <UserX className="w-5 h-5" /> Rechazar
                    </Button>
                    <Button variant="ghost" className="px-4" onClick={() => setDetailRequest(null)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
