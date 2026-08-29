import { Link } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useEmpresas } from '@/features/empresas';
import type { MemberRequest } from '@/features/empresas';
import { solicitudesService } from '@/features/proyectos';
import { useSolicitudesMembresia, useResponderSolicitudMembresia } from '@/features/usuarios';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { Badge } from '@/shared/components/ui/Badge';
import { Avatar } from '@/shared/components/ui/Avatar';
import { ProjectImage } from '@/shared/components/ui/ProjectImage';
import { PROYECTO_ESTADO } from '@/shared/constants/proyecto';
import { StatCard } from '@/shared/components/dashboard/StatCard';
import { DashboardSection } from '@/shared/components/dashboard/DashboardSection';
import { ChartFrame, RankedBars, SegmentedBar, MonthlyColumns } from '@/shared/components/dashboard/AnalyticsCharts';
import { compactMoney } from '@/shared/utils/numberFormat';
import { ODS_POR_ID } from '@/shared/constants/ods';
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
  ShieldCheck,
  UserPlus,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

interface ProjectPendingGroup {
  proyecto_id: number;
  proyecto_nombre: string;
  solicitudes: Array<{
    id: number;
    mensaje: string;
    propuesta?: string;
    propuesta_url?: string;
    cv_url?: string;
    fecha_creacion: string;
    usuario?: { id: number; nombre_completo: string; correo: string; cargo?: string };
  }>;
}

export default function CompanyDashboard() {
  const { currentUser, users, projects, requests, openBase64 } = useApp();
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
    // El superadmin tiene su propio panel. El resto (admin de empresa, empleado
    // e independiente) usa este: el contenido se adapta al rol más abajo.
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

  // ── Panorama de la empresa: SOLO los proyectos de mi empresa ──────────────
  const [ahora] = useState(() => Date.now());
  const panorama = useMemo(() => {
    const empresaId = currentUser?.empresa_id;
    const companyProjects = empresaId
      ? projects.filter(p => {
          const creador = users.find(u => u.id === p.creador_id);
          return creador?.empresa_id === empresaId;
        })
      : [];

    const activos = companyProjects.filter(p => p.estado === 'en_curso' && !p.suspendido).length;
    const terminados = companyProjects.filter(p => p.estado === 'terminado').length;
    const archivados = companyProjects.filter(p => p.estado === 'archivado').length;
    const suspendidos = companyProjects.filter(p => p.suspendido).length;
    const financiamiento = companyProjects.reduce((s, p) => s + (Number(p.financiamiento) || 0), 0);
    const colaboradores = new Set(
      companyProjects.flatMap(p => (p.participantes ?? []).map(x => x.usuario_id)),
    ).size;

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const altasPorMes = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(ahora);
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const y = d.getFullYear();
      const mo = d.getMonth();
      return {
        month: meses[mo],
        proyectos: companyProjects.filter(p => {
          const t = new Date(p.fecha_creacion || p.fecha_inicio).getTime();
          if (!isFinite(t)) return false;
          const pd = new Date(t);
          return pd.getFullYear() === y && pd.getMonth() === mo;
        }).length,
      };
    });

    const porCategoria = (() => {
      const map = new Map<string, number>();
      for (const p of companyProjects) {
        const k = p.categoria || 'Sin categoría';
        map.set(k, (map.get(k) ?? 0) + 1);
      }
      return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    })();

    const odsCount = new Map<number, number>();
    for (const p of companyProjects) {
      if (!Array.isArray(p.ods)) continue;
      for (const id of p.ods) odsCount.set(id, (odsCount.get(id) ?? 0) + 1);
    }
    const porOds = [...odsCount.entries()]
      .map(([id, value]) => ({ label: `ODS ${id}`, hint: ODS_POR_ID[id]?.nombre, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const equipoPorProyecto = companyProjects
      .map(p => ({ label: p.nombre, value: p.participantes?.length ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      total: companyProjects.length, activos, terminados, archivados, suspendidos,
      financiamiento, colaboradores, altasPorMes, porCategoria, porOds, equipoPorProyecto,
    };
  }, [projects, users, currentUser?.empresa_id, ahora]);

  // ── Mi actividad: panorama del empleado / independiente sobre los proyectos
  // en los que participa (no crea) y las solicitudes que envió. ──────────────
  const miActividad = useMemo(() => {
    const misProyectos = projects.filter(
      (p) => p.participantes?.some((x) => x.usuario_id === currentUser?.id) && p.creador_id !== currentUser?.id,
    );

    const activos = misProyectos.filter((p) => p.estado === 'en_curso' && !p.suspendido).length;
    const terminados = misProyectos.filter((p) => p.estado === 'terminado').length;
    const archivados = misProyectos.filter((p) => p.estado === 'archivado').length;
    const suspendidos = misProyectos.filter((p) => p.suspendido).length;

    const empresas = new Set(
      misProyectos
        .map((p) => users.find((u) => u.id === p.creador_id)?.empresa_id)
        .filter((x): x is number => typeof x === 'number'),
    ).size;

    const porCategoria = (() => {
      const map = new Map<string, number>();
      for (const p of misProyectos) {
        const k = p.categoria || 'Sin categoría';
        map.set(k, (map.get(k) ?? 0) + 1);
      }
      return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    })();

    const odsCount = new Map<number, number>();
    for (const p of misProyectos) {
      if (!Array.isArray(p.ods)) continue;
      for (const id of p.ods) odsCount.set(id, (odsCount.get(id) ?? 0) + 1);
    }
    const porOds = [...odsCount.entries()]
      .map(([id, value]) => ({ label: `ODS ${id}`, hint: ODS_POR_ID[id]?.nombre, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const misSolicitudes = requests.filter((r) => r.usuario_id === currentUser?.id);
    const solPend = misSolicitudes.filter((r) => r.estado === 'pendiente').length;
    const solAcep = misSolicitudes.filter((r) => r.estado === 'aceptado').length;
    const solRech = misSolicitudes.filter((r) => r.estado === 'rechazado').length;

    return {
      total: misProyectos.length, activos, terminados, archivados, suspendidos,
      empresas, porCategoria, porOds,
      solTotal: misSolicitudes.length, solPend, solAcep, solRech,
    };
  }, [projects, users, requests, currentUser?.id]);

  // El empleado no crea proyectos ni recibe solicitudes: su única métrica real
  // es en cuántos colabora. El admin ve el panel completo.
  const stats: {
    label: string;
    value: number;
    subtext: string;
    icon: typeof FolderKanban;
    tone: 'primary' | 'success' | 'warning' | 'muted';
    attention?: boolean;
    to: string;
  }[] = esAdmin
    ? [
        {
          label: 'Mis Proyectos',
          value: myProjects.length,
          subtext: 'Proyectos creados por ti',
          icon: FolderKanban,
          tone: 'primary',
          to: '/dashboard/projects#owned',
        },
        {
          label: 'Colaboraciones',
          value: collaboratingProjects.length,
          subtext: 'Proyectos en los que participas',
          icon: Users,
          tone: 'success',
          to: '/dashboard/projects#colab',
        },
        {
          label: 'Solicitudes de Proyectos',
          value: totalProjectPending,
          subtext: totalProjectPending > 0 ? 'Nuevas solicitudes pendientes' : 'Sin solicitudes pendientes',
          icon: UserPlus,
          tone: totalProjectPending > 0 ? 'primary' : 'muted',
          attention: true,
          to: '#project-requests-section',
        },
        {
          label: 'Solicitudes Miembros',
          value: pendingMembers.length,
          subtext: pendingMembers.length > 0 ? 'Nuevos miembros esperando' : 'No hay solicitudes nuevas',
          icon: Clock,
          tone: pendingMembers.length > 0 ? 'warning' : 'muted',
          attention: true,
          to: '#member-requests-section',
        },
      ]
    : [
        {
          label: 'Colaboraciones activas',
          value: miActividad.activos,
          subtext: `${miActividad.total} en total · ${miActividad.terminados} terminadas`,
          icon: FolderKanban,
          tone: 'primary',
          to: '/dashboard/projects#colab',
        },
        {
          label: 'Empresas',
          value: miActividad.empresas,
          subtext: 'con las que colaboras',
          icon: Building2,
          tone: 'success',
          to: '/dashboard/projects#colab',
        },
        {
          label: 'Solicitudes enviadas',
          value: miActividad.solTotal,
          subtext: `${miActividad.solAcep} aceptada(s) · ${miActividad.solRech} rechazada(s)`,
          icon: UserPlus,
          tone: 'muted',
          to: '/explore',
        },
        {
          label: 'Solicitudes pendientes',
          value: miActividad.solPend,
          subtext: miActividad.solPend > 0 ? 'Esperando respuesta' : 'Sin solicitudes en curso',
          icon: Clock,
          tone: miActividad.solPend > 0 ? 'warning' : 'muted',
          attention: true,
          to: '/explore',
        },
      ];

  const isCompanyAdmin = currentUser?.rol === 'admin' && !!userCompany;

  return (
    <>
      {isCompanyAdmin && currentUser && !currentUser.onboarding_completado && <OnboardingWizard />}
      <AppLayout contained mainClassName="flex-1 py-8 px-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  name={currentUser?.nombre_completo ?? '?'}
                  src={currentUser?.foto_url}
                  className="w-14 h-14 rounded-2xl text-xl shadow-lg shadow-primary/20"
                  fallbackClassName="bg-primary text-primary-foreground font-black"
                />
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
                {esAdmin && (
                  <Link to="/dashboard/create-project">
                    <Button variant="primary" className="flex items-center gap-2 shadow-md shadow-primary/20">
                      <Plus className="w-4 h-4" />
                      Nuevo Proyecto
                    </Button>
                  </Link>
                )}
                <Link to="/explore">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Explorar
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Métricas */}
          <div className={`grid gap-6 mb-8 ${stats.length === 1 ? 'max-w-xs' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
                <StatCard
                  label={stat.label}
                  value={stat.value}
                  subtext={stat.subtext}
                  icon={stat.icon}
                  tone={stat.tone}
                  attention={stat.attention}
                  to={stat.to}
                />
              </motion.div>
            ))}
          </div>

          {/* Quick Actions — mobile only (desktop buttons in header) */}
          <div className="md:hidden grid grid-cols-2 gap-4 mb-8">
            {esAdmin && (
              <Link to="/dashboard/create-project">
                <Card className="p-5 bg-primary/10 border-primary/20 hover:shadow-md transition-all cursor-pointer">
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center mb-3 shadow-md shadow-primary/20">
                    <Plus className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <p className="font-bold text-sm">Nuevo Proyecto</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Publica y encuentra colaboradores</p>
                </Card>
              </Link>
            )}
            <Link to="/explore">
              <Card className="p-5 bg-muted border-border hover:shadow-md transition-all cursor-pointer">
                <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center mb-3 shadow-md">
                  <Search className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="font-bold text-sm">Explorar</p>
                <p className="text-xs text-muted-foreground mt-0.5">Descubre colaboraciones</p>
              </Card>
            </Link>
          </div>

          {/* Panorama de la empresa — métricas SOLO de los proyectos de mi empresa */}
          {esAdmin && panorama.total > 0 && (
            <DashboardSection title="Panorama de mis proyectos" subtitle={`${panorama.total} proyecto(s) de ${userCompany?.nombre ?? 'tu empresa'}`}>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Activos" value={panorama.activos} subtext={`${panorama.terminados} terminados`} icon={FolderKanban} tone="primary" />
                <StatCard label="Colaboradores" value={panorama.colaboradores} subtext="personas en tus proyectos" icon={Users} tone="primary" />
                <StatCard label="Financiamiento" value={compactMoney(panorama.financiamiento)} subtext="presupuesto declarado" icon={DollarSign} tone="info" />
                <StatCard label="Suspendidos" value={panorama.suspendidos} subtext={panorama.suspendidos > 0 ? 'requieren atención' : 'todo en orden'} icon={CheckCircle2} tone={panorama.suspendidos > 0 ? 'warning' : 'muted'} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <ChartFrame title="Proyectos nuevos por mes" subtitle="Altas en los últimos 6 meses">
                    <MonthlyColumns
                      data={panorama.altasPorMes}
                      series={[{ key: 'proyectos', name: 'Proyectos', colorVar: 'var(--color-chart-1)' }]}
                    />
                  </ChartFrame>
                </div>

                <ChartFrame title="Estado de mis proyectos" subtitle={`${panorama.total} en total`}>
                  <SegmentedBar
                    segments={[
                      { label: 'En curso', value: panorama.activos, colorVar: 'var(--color-info)' },
                      { label: 'Terminados', value: panorama.terminados, colorVar: 'var(--color-success)' },
                      { label: 'Archivados', value: panorama.archivados, colorVar: 'var(--color-muted-foreground)' },
                      { label: 'Suspendidos', value: panorama.suspendidos, colorVar: 'var(--color-danger)' },
                    ]}
                  />
                </ChartFrame>

                <ChartFrame title="Proyectos por categoría">
                  <RankedBars data={panorama.porCategoria} />
                </ChartFrame>

                <ChartFrame title="Aporte a los ODS" subtitle="Objetivos de Desarrollo Sostenible (top 6)">
                  <RankedBars data={panorama.porOds} emptyLabel="Tus proyectos aún no declaran ODS" />
                </ChartFrame>

                <ChartFrame title="Equipo por proyecto" subtitle="Colaboradores en cada proyecto">
                  <RankedBars data={panorama.equipoPorProyecto} emptyLabel="Sin participantes todavía" />
                </ChartFrame>
              </div>
            </DashboardSection>
          )}

          {/* Mis Proyectos — solo el admin de empresa crea proyectos */}
          {esAdmin && (
          <DashboardSection
            title="Mis Proyectos"
            subtitle={`${myProjects.length} proyecto(s) creado(s)`}
            action={
              <Link to="/dashboard/projects">
                <Button variant="ghost" className="flex items-center gap-1.5 text-sm">
                  Ver todos <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            }
          >
            {myProjects.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProjects.slice(0, 3).map((project) => {
                  const estadoCfg = PROYECTO_ESTADO[project.estado] ?? { variant: 'neutral' as const, label: project.estado };
                  return (
                    <Card key={project.id} className="group relative overflow-hidden h-full min-h-[240px] flex flex-col rounded-2xl border border-white/10 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                      <ProjectImage
                        imagenes={project.imagenes}
                        alt={project.nombre}
                        fallback="dark"
                        className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 z-10 bg-black/55 pointer-events-none" />
                      <div className="relative z-20 flex flex-col h-full p-4 text-white">
                        <div className="flex justify-end">
                          <span className="bg-white/20 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            {project.categoria || 'Tecnología'}
                          </span>
                        </div>
                        <div className="mt-auto flex flex-col gap-2.5">
                          <div>
                            <h3 className="text-lg font-black leading-tight line-clamp-1 drop-shadow-md mb-0.5">{project.nombre}</h3>
                            <p className="text-xs text-white/80 line-clamp-2 drop-shadow-sm">{project.descripcion_corta}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-medium text-white/90 shadow-sm">
                              <Calendar className="w-3 h-3" />
                              <span>{project.fecha_inicio}</span>
                            </span>
                            <span className="bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white/90 shadow-sm">
                              {estadoCfg.label}
                            </span>
                          </div>
                          <Link to={`/grupo-trabajo/${project.id}`} className="block w-full">
                            <button className="w-full rounded-full bg-background text-foreground hover:bg-muted font-extrabold py-2.5 text-xs transition-transform hover:scale-[1.02] shadow-lg">
                              Ver Grupo de Trabajo
                            </button>
                          </Link>
                        </div>
                      </div>
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
          </DashboardSection>
          )}

          {/* Mi actividad — panorama del empleado / independiente */}
          {!esAdmin && (miActividad.total > 0 || miActividad.solTotal > 0) && (
            <DashboardSection title="Mi actividad" subtitle="Tus colaboraciones y solicitudes">
              <div className="grid gap-6 lg:grid-cols-2">
                {miActividad.total > 0 && (
                  <ChartFrame title="Estado de mis colaboraciones" subtitle={`${miActividad.total} proyecto(s)`}>
                    <SegmentedBar
                      segments={[
                        { label: 'En curso', value: miActividad.activos, colorVar: 'var(--color-info)' },
                        { label: 'Terminadas', value: miActividad.terminados, colorVar: 'var(--color-success)' },
                        { label: 'Archivadas', value: miActividad.archivados, colorVar: 'var(--color-muted-foreground)' },
                        { label: 'Suspendidas', value: miActividad.suspendidos, colorVar: 'var(--color-danger)' },
                      ]}
                    />
                  </ChartFrame>
                )}

                {miActividad.solTotal > 0 && (
                  <ChartFrame title="Mis solicitudes por estado" subtitle={`${miActividad.solTotal} enviada(s)`}>
                    <SegmentedBar
                      segments={[
                        { label: 'Pendientes', value: miActividad.solPend, colorVar: 'var(--color-warning)' },
                        { label: 'Aceptadas', value: miActividad.solAcep, colorVar: 'var(--color-success)' },
                        { label: 'Rechazadas', value: miActividad.solRech, colorVar: 'var(--color-danger)' },
                      ]}
                    />
                  </ChartFrame>
                )}

                {miActividad.total > 0 && (
                  <ChartFrame title="Colaboraciones por categoría">
                    <RankedBars data={miActividad.porCategoria} />
                  </ChartFrame>
                )}

                {miActividad.total > 0 && (
                  <ChartFrame title="Aporte a los ODS" subtitle="Objetivos de los proyectos donde colaboras (top 6)">
                    <RankedBars data={miActividad.porOds} emptyLabel="Tus proyectos aún no declaran ODS" />
                  </ChartFrame>
                )}
              </div>
            </DashboardSection>
          )}

          {/* Proyectos en Colaboración — contenido principal del empleado */}
          {(!esAdmin || collaboratingProjects.length > 0) && (
            <DashboardSection
              title="Proyectos en Colaboración"
              subtitle={`${collaboratingProjects.length} proyecto(s)`}
            >
              {collaboratingProjects.length > 0 ? (
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
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
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
              ) : (
                <Card className="p-10 text-center border-none shadow-sm border-dashed">
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-primary/40" />
                  </div>
                  <h3 className="font-bold mb-1">Aún no colaboras en ningún proyecto</h3>
                  <p className="text-muted-foreground text-sm mb-5">Explora proyectos abiertos y postula al que encaje contigo.</p>
                  <Link to="/explore">
                    <Button variant="primary" className="shadow-md shadow-primary/20">Explorar Proyectos</Button>
                  </Link>
                </Card>
              )}
            </DashboardSection>
          )}

          {/* ── Solicitudes de Miembros Pendientes — solo admin de empresa ── */}
          {esAdmin && pendingMembers.length > 0 && (
            <motion.div id="member-requests-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <DashboardSection
              title="Solicitudes de Miembros"
              icon={Clock}
              iconClassName="text-warning"
              count={pendingMembers.length}
              countTone="warning"
              action={
                <Link to="/dashboard/members">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    Ver todo <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              }
            >
              <div className="space-y-3">
                {pendingMembers.slice(0, 3).map(mr => (
                  <motion.div key={mr.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="p-5 border-l-4 border-l-warning hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        {/* Avatar + Info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-warning rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0 shadow-md">
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
                                className="flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline font-medium transition-colors group"
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
            </DashboardSection>
            </motion.div>
          )}

          {/* ── Solicitudes de Participación en mis proyectos ── */}
          {projectPendingGroups.length > 0 && (
            <motion.div id="project-requests-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <DashboardSection
              title="Solicitudes de Participación"
              subtitle="En los proyectos que gestionas"
              icon={UserPlus}
              iconClassName="text-info-strong"
              count={totalProjectPending}
              countTone="info"
            >
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
                          <div key={sol.id} className="px-6 py-4 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
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
                              {sol.propuesta && (
                                <p className="text-xs text-info-strong mt-1 line-clamp-2">
                                  <span className="font-semibold">Propuesta:</span> {sol.propuesta}
                                </p>
                              )}
                              {sol.propuesta_url && (
                                <button
                                  onClick={() => openBase64(sol.propuesta_url!)}
                                  className="mt-1 flex items-center gap-1 text-xs text-info-strong hover:underline font-medium"
                                >
                                  <FileText className="w-3 h-3" /> Ver documento de la propuesta
                                </button>
                              )}
                              {sol.cv_url && (
                                <button
                                  onClick={() => openBase64(sol.cv_url!)}
                                  className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                >
                                  <FileText className="w-3 h-3" /> Ver CV
                                </button>
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
            </DashboardSection>
            </motion.div>
          )}

      {/* ── Detail Modal ── */}
      <Modal
        open={!!detailRequest}
        onClose={() => setDetailRequest(null)}
        titulo="Solicitud de membresía"
        size="lg"
        acciones={detailRequest ? (
          <>
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => { rejectMemberRequest(detailRequest.id); setDetailRequest(null); }}
            >
              <UserX className="w-4 h-4" aria-hidden="true" /> Rechazar
            </Button>
            <Button
              variant="primary"
              onClick={() => { approveMemberRequest(detailRequest.id); setDetailRequest(null); }}
            >
              <UserCheck className="w-4 h-4" aria-hidden="true" /> Aprobar solicitud
            </Button>
          </>
        ) : undefined}
      >
        {detailRequest && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Datos personales */}
                    <div>
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Datos Personales</h3>
                      <div className="space-y-4">
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-warning rounded-2xl flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg">
                            {detailRequest.usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="font-bold text-lg leading-tight">{detailRequest.usuario?.nombre_completo}</p>
                            <Badge variant="warning">Pendiente de Aprobación</Badge>
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
        )}
      </Modal>
      </AppLayout>
    </>
  );
}
