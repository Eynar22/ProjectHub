import { useProyectos } from '@/features/proyectos';
import { useEmpresas } from '@/features/empresas';
import { useUsuarios } from '@/features/usuarios';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Card } from '@/shared/components/ui/Card';
import { StatCard } from '@/shared/components/dashboard/StatCard';
import { DashboardSection } from '@/shared/components/dashboard/DashboardSection';
import { Link } from 'react-router';
import { Building2, FolderKanban, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminDashboard() {
  const { data: companies = [] } = useEmpresas();
  const { data: projects = [] } = useProyectos();
  const { data: users = [] } = useUsuarios(true);

  const approvedCompanies = companies.filter(c => c.estado === 'aprobado').length;
  const pendingCompanies = companies.filter(c => c.estado === 'pendiente').length;
  const totalProjects = projects.length;

  const stats = [
    {
      label: 'Total Empresas',
      value: companies.length,
      subtext: `${approvedCompanies} aprobadas`,
      icon: Building2,
      tone: 'primary' as const,
      to: '/admin/companies',
    },
    {
      label: 'Total Proyectos',
      value: totalProjects,
      subtext: 'Activos en la plataforma',
      icon: FolderKanban,
      tone: 'primary' as const,
      to: '/admin/projects',
    },
    {
      label: 'Empresas Pendientes',
      value: pendingCompanies,
      subtext: pendingCompanies > 0 ? 'Requieren aprobación' : 'Nada por revisar',
      icon: Clock,
      tone: (pendingCompanies > 0 ? 'warning' : 'muted') as 'warning' | 'muted',
      attention: true,
      to: '/admin/companies?filter=pending',
    },
    {
      label: 'Usuarios Registrados',
      value: users.length,
      subtext: 'En la plataforma',
      icon: Users,
      tone: 'primary' as const,
      to: '/admin/users',
    },
  ];

  // Chart data
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  // Calculate projects by month for the last 6 months
  const projectsByMonth = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    
    const count = projects.filter(p => {
      const pDate = new Date(p.fecha_creacion || p.fecha_inicio);
      return pDate.getMonth() === month && pDate.getFullYear() === year;
    }).length;

    return {
      month: monthNames[month],
      projects: count
    };
  });

  const companyStatusData = [
    { name: 'Aprobadas', value: approvedCompanies, color: 'var(--color-success)' },
    { name: 'Pendientes', value: pendingCompanies, color: 'var(--color-warning)' },
    { name: 'Bloqueadas', value: companies.filter(c => c.estado === 'bloqueado').length, color: 'var(--color-danger)' }
  ];

  return (
    <AppLayout isAdmin contained mainClassName="flex-1 p-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-black tracking-tight mb-1">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">Gestiona empresas, proyectos y usuarios de la plataforma</p>
          </motion.div>

          {/* Métricas */}
          <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
                <StatCard
                  label={stat.label}
                  value={stat.value}
                  subtext={stat.subtext}
                  icon={stat.icon}
                  tone={stat.tone}
                  attention={'attention' in stat ? stat.attention : undefined}
                  to={stat.to}
                />
              </motion.div>
            ))}
          </div>

          {/* Empresas Recientes */}
          <DashboardSection
            title="Empresas Recientes"
            icon={Building2}
            action={<Link to="/admin/companies"><span className="text-sm font-medium text-primary hover:underline">Ver todas</span></Link>}
          >
            <Card className="p-4 sm:p-6 border-none shadow-sm">
              <div className="space-y-2">
                {[...companies]
                  .sort((a, b) => new Date(b.fecha_registro || 0).getTime() - new Date(a.fecha_registro || 0).getTime())
                  .slice(0, 5).map(company => (
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

          {/* Proyectos Recientes */}
          <DashboardSection
            title="Proyectos Recientes"
            icon={FolderKanban}
            action={<Link to="/admin/projects"><span className="text-sm font-medium text-primary hover:underline">Ver todos</span></Link>}
          >
            <Card className="p-4 sm:p-6 border-none shadow-sm">
              <div className="space-y-2">
                {[...projects]
                  .sort((a, b) => new Date(b.fecha_creacion || b.fecha_inicio || 0).getTime() - new Date(a.fecha_creacion || a.fecha_inicio || 0).getTime())
                  .slice(0, 5).map(project => {
                  const creator = users.find(u => u.id === project.creador_id);
                  const company = companies.find(c => c.id === creator?.empresa_id);
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

          {/* Panorama — monitoreo, va al final */}
          <DashboardSection title="Panorama de la plataforma" className="mb-0">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Projects by Month */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Proyectos por Mes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-card)', 
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="projects" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" />
                      <stop offset="100%" stopColor="var(--color-chart-2)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Company Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Estado de Empresas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={companyStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    fill="var(--color-chart-1)"
                    dataKey="value"
                  >
                    {companyStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Empresas`, 'Cantidad']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
          </DashboardSection>
    </AppLayout>
  );
}
