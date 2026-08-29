import { useMemo, useState } from 'react';
import { useProyectos } from '@/features/proyectos';
import { useEmpresas } from '@/features/empresas';
import { useUsuarios } from '@/features/usuarios';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Card } from '@/shared/components/ui/Card';
import { StatCard } from '@/shared/components/dashboard/StatCard';
import { DashboardSection } from '@/shared/components/dashboard/DashboardSection';
import {
  ChartFrame, RankedBars, SegmentedBar, MonthlyColumns,
} from '@/shared/components/dashboard/AnalyticsCharts';
import { compactMoney, compactNumber } from '@/shared/utils/numberFormat';
import { ODS_POR_ID } from '@/shared/constants/ods';
import { Link } from 'react-router';
import { Building2, FolderKanban, Users, Clock, DollarSign, UserCircle, Target, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIA = 86_400_000;

export default function AdminDashboard() {
  const { data: companies = [] } = useEmpresas();
  const { data: projects = [] } = useProyectos();
  const { data: users = [] } = useUsuarios(true);
  // Fijo al montar: para ventanas de 30 días y "este mes" no necesita refrescar
  // en cada render (y evita el impredecible Date.now() dentro de useMemo).
  const [ahora] = useState(() => Date.now());

  const m = useMemo(() => {
    const hace30 = ahora - 30 * DIA;

    const desde = (s?: string | null) => (s ? new Date(s).getTime() : NaN);
    const nuevos30 = (arr: { fecha_registro?: string }[]) =>
      arr.filter((x) => desde(x.fecha_registro) >= hace30).length;

    // --- empresas ---
    const empAprob = companies.filter((c) => c.estado === 'aprobado').length;
    const empPend = companies.filter((c) => c.estado === 'pendiente').length;
    const empBloq = companies.filter((c) => c.estado === 'bloqueado').length;
    const empRech = companies.filter((c) => c.estado === 'rechazado').length;
    const empDecididas = empAprob + empRech + empBloq;
    const tasaAprob = empDecididas ? Math.round((empAprob / empDecididas) * 100) : 0;

    // --- usuarios ---
    const usrActivos = users.filter((u) => u.estado === 'activo').length;
    const admins = users.filter((u) => u.rol === 'admin').length;
    const empleados = users.filter((u) => u.rol === 'empleado' && u.empresa_id).length;
    const independientes = users.filter(
      (u) => u.rol === 'colaborador' || (u.rol === 'empleado' && !u.empresa_id),
    ).length;

    // --- proyectos ---
    const projActivos = projects.filter((p) => p.estado === 'en_curso' && !p.suspendido).length;
    const projTerm = projects.filter((p) => p.estado === 'terminado').length;
    const projArch = projects.filter((p) => p.estado === 'archivado').length;
    const projSusp = projects.filter((p) => p.suspendido).length;
    const financiamiento = projects.reduce((s, p) => s + (Number(p.financiamiento) || 0), 0);
    const conFinanciamiento = projects.filter((p) => Number(p.financiamiento) > 0).length;
    const conOds = projects.filter((p) => Array.isArray(p.ods) && p.ods.length > 0).length;

    // --- altas por mes (últimos 6) ---
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(ahora);
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      return { y: d.getFullYear(), mo: d.getMonth() };
    });
    const enMes = (t: number, y: number, mo: number) => {
      if (!isFinite(t)) return false;
      const d = new Date(t);
      return d.getFullYear() === y && d.getMonth() === mo;
    };
    const altasPorMes = meses.map(({ y, mo }) => ({
      month: MESES[mo],
      empresas: companies.filter((c) => enMes(desde(c.fecha_registro), y, mo)).length,
      usuarios: users.filter((u) => enMes(desde(u.fecha_registro), y, mo)).length,
      proyectos: projects.filter((p) => enMes(desde(p.fecha_creacion || p.fecha_inicio), y, mo)).length,
    }));

    // --- rankings ---
    const porClave = <T,>(arr: T[], clave: (x: T) => string | undefined, valor: (x: T) => number) => {
      const map = new Map<string, number>();
      for (const x of arr) {
        const k = clave(x);
        if (!k) continue;
        map.set(k, (map.get(k) ?? 0) + valor(x));
      }
      return [...map.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    };

    const projPorCategoria = porClave(projects, (p) => p.categoria || 'Sin categoría', () => 1);
    const finPorCategoria = porClave(
      projects.filter((p) => Number(p.financiamiento) > 0),
      (p) => p.categoria || 'Sin categoría',
      (p) => Number(p.financiamiento) || 0,
    );

    const odsCount = new Map<number, number>();
    for (const p of projects) {
      if (!Array.isArray(p.ods)) continue;
      for (const id of p.ods) odsCount.set(id, (odsCount.get(id) ?? 0) + 1);
    }
    const projPorOds = [...odsCount.entries()]
      .map(([id, value]) => ({ label: `ODS ${id}`, hint: ODS_POR_ID[id]?.nombre, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      empAprob, empPend, empBloq, empRech, tasaAprob,
      usrActivos, admins, empleados, independientes,
      projActivos, projTerm, projArch, projSusp, financiamiento, conFinanciamiento, conOds,
      nuevasEmp30: nuevos30(companies), nuevosUsr30: nuevos30(users),
      altasPorMes, projPorCategoria, finPorCategoria, projPorOds,
    };
  }, [companies, projects, users, ahora]);

  const kpis = [
    {
      label: 'Empresas aprobadas', value: m.empAprob, icon: Building2, tone: 'primary' as const,
      subtext: m.nuevasEmp30 > 0 ? `+${m.nuevasEmp30} en 30 días · ${companies.length} en total` : `${companies.length} registradas`,
      to: '/admin/companies',
    },
    {
      label: 'Proyectos activos', value: m.projActivos, icon: FolderKanban, tone: 'primary' as const,
      subtext: `${m.projTerm} terminados · ${projects.length} en total`,
      to: '/admin/projects',
    },
    {
      label: 'Usuarios activos', value: m.usrActivos, icon: Users, tone: 'primary' as const,
      subtext: m.nuevosUsr30 > 0 ? `+${m.nuevosUsr30} en 30 días · ${users.length} en total` : `${users.length} registrados`,
      to: '/admin/users',
    },
    {
      label: 'Empresas pendientes', value: m.empPend, icon: Clock,
      tone: (m.empPend > 0 ? 'warning' : 'muted') as 'warning' | 'muted',
      subtext: m.empPend > 0 ? 'Requieren aprobación' : 'Nada por revisar',
      attention: true, to: '/admin/companies?filter=pending',
    },
    {
      label: 'Financiamiento movilizado', value: compactMoney(m.financiamiento), icon: DollarSign, tone: 'info' as const,
      subtext: `${m.conFinanciamiento} proyecto(s) con presupuesto`,
    },
    {
      label: 'Tasa de aprobación', value: `${m.tasaAprob}%`, icon: CheckCircle2,
      tone: (m.tasaAprob >= 60 ? 'success' : 'warning') as 'success' | 'warning',
      subtext: 'de empresas ya evaluadas',
    },
    {
      label: 'Colaboradores independientes', value: m.independientes, icon: UserCircle, tone: 'muted' as const,
      subtext: 'usuarios sin empresa',
    },
    {
      label: 'Proyectos con ODS', value: m.conOds, icon: Target, tone: 'muted' as const,
      subtext: `de ${projects.length} publicados`,
    },
  ];

  return (
    <AppLayout isAdmin contained mainClassName="flex-1 p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-black tracking-tight mb-1">Panel de Administración</h1>
        <p className="text-sm text-muted-foreground">Métricas de empresas, proyectos y usuarios de la plataforma</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 mb-10 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard
              label={k.label}
              value={k.value}
              subtext={k.subtext}
              icon={k.icon}
              tone={k.tone}
              attention={'attention' in k ? k.attention : undefined}
              to={'to' in k ? k.to : undefined}
            />
          </motion.div>
        ))}
      </div>

      {/* Panorama — gráficos */}
      <DashboardSection title="Panorama de la plataforma" subtitle="Crecimiento, distribución y estado">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ChartFrame title="Altas por mes" subtitle="Nuevos registros en los últimos 6 meses">
              <MonthlyColumns
                data={m.altasPorMes}
                series={[
                  { key: 'empresas', name: 'Empresas', colorVar: 'var(--color-chart-1)' },
                  { key: 'usuarios', name: 'Usuarios', colorVar: 'var(--color-chart-2)' },
                  { key: 'proyectos', name: 'Proyectos', colorVar: 'var(--color-chart-3)' },
                ]}
              />
            </ChartFrame>
          </div>

          <ChartFrame title="Proyectos por categoría" subtitle="Cuántos proyectos hay en cada sector">
            <RankedBars data={m.projPorCategoria} format={(n) => compactNumber(n)} />
          </ChartFrame>

          <ChartFrame title="Financiamiento por categoría" subtitle="Presupuesto declarado, sumado por sector">
            <RankedBars
              data={m.finPorCategoria}
              colorVar="var(--color-chart-2)"
              format={compactMoney}
              emptyLabel="Ningún proyecto declaró presupuesto"
            />
          </ChartFrame>

          <ChartFrame title="Aporte a los ODS" subtitle="Proyectos por Objetivo de Desarrollo Sostenible (top 8)">
            <RankedBars
              data={m.projPorOds}
              format={(n) => compactNumber(n)}
              emptyLabel="Todavía ningún proyecto declaró ODS"
            />
          </ChartFrame>

          <ChartFrame title="Estado de las empresas" subtitle={`${companies.length} en total`}>
            <SegmentedBar
              segments={[
                { label: 'Aprobadas', value: m.empAprob, colorVar: 'var(--color-success)' },
                { label: 'Pendientes', value: m.empPend, colorVar: 'var(--color-warning)' },
                { label: 'Bloqueadas', value: m.empBloq, colorVar: 'var(--color-danger)' },
                { label: 'Rechazadas', value: m.empRech, colorVar: 'var(--color-muted-foreground)' },
              ]}
            />
          </ChartFrame>

          <ChartFrame title="Estado de los proyectos" subtitle={m.projSusp > 0 ? `${m.projSusp} suspendido(s)` : `${projects.length} en total`}>
            <SegmentedBar
              segments={[
                { label: 'En curso', value: m.projActivos, colorVar: 'var(--color-info)' },
                { label: 'Terminados', value: m.projTerm, colorVar: 'var(--color-success)' },
                { label: 'Archivados', value: m.projArch, colorVar: 'var(--color-muted-foreground)' },
                { label: 'Suspendidos', value: m.projSusp, colorVar: 'var(--color-danger)' },
              ]}
            />
          </ChartFrame>

          <ChartFrame title="Composición de usuarios" subtitle="Sin contar al superadmin">
            <SegmentedBar
              segments={[
                { label: 'Admins de empresa', value: m.admins, colorVar: 'var(--color-chart-1)' },
                { label: 'Empleados', value: m.empleados, colorVar: 'var(--color-chart-3)' },
                { label: 'Independientes', value: m.independientes, colorVar: 'var(--color-chart-4)' },
              ]}
            />
          </ChartFrame>
        </div>
      </DashboardSection>

      {/* Empresas recientes */}
      <DashboardSection
        title="Empresas recientes"
        icon={Building2}
        action={<Link to="/admin/companies"><span className="text-sm font-medium text-primary hover:underline">Ver todas</span></Link>}
      >
        <Card className="p-4 sm:p-6 border-none shadow-sm">
          <div className="space-y-2">
            {[...companies]
              .sort((a, b) => new Date(b.fecha_registro || 0).getTime() - new Date(a.fecha_registro || 0).getTime())
              .slice(0, 5).map((company) => (
                <Link
                  key={company.id}
                  to={`/admin/companies/${company.id}/review`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.nombre} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{company.nombre}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {company.descripcion ? company.descripcion.slice(0, 60) : 'Sin descripción'}
                      </div>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    company.estado === 'aprobado'
                      ? 'bg-success-subtle text-success-strong border-success/30'
                      : company.estado === 'pendiente'
                      ? 'bg-warning-subtle text-warning-strong border-warning/30'
                      : 'bg-danger-subtle text-danger-strong border-danger/30'
                  }`}>
                    {company.estado === 'aprobado' ? 'Aprobada' : company.estado === 'pendiente' ? 'Pendiente' : 'Bloqueada'}
                  </span>
                </Link>
              ))}
          </div>
        </Card>
      </DashboardSection>

      {/* Proyectos recientes */}
      <DashboardSection
        title="Proyectos recientes"
        icon={FolderKanban}
        className="mb-0"
        action={<Link to="/admin/projects"><span className="text-sm font-medium text-primary hover:underline">Ver todos</span></Link>}
      >
        <Card className="p-4 sm:p-6 border-none shadow-sm">
          <div className="space-y-2">
            {[...projects]
              .sort((a, b) => new Date(b.fecha_creacion || b.fecha_inicio || 0).getTime() - new Date(a.fecha_creacion || a.fecha_inicio || 0).getTime())
              .slice(0, 5).map((project) => {
                const creator = users.find((u) => u.id === project.creador_id);
                const company = companies.find((c) => c.id === creator?.empresa_id);
                return (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold flex items-center gap-2 min-w-0">
                          <span className="truncate">{project.nombre}</span>
                          <span className="flex-shrink-0 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            {project.categoria || 'Tecnología'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          por {creator?.nombre_completo ?? '—'}{company ? ` · ${company.nombre}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground flex-shrink-0">
                      {project.participantes?.length || 0} colab.
                    </div>
                  </Link>
                );
              })}
          </div>
        </Card>
      </DashboardSection>
    </AppLayout>
  );
}
