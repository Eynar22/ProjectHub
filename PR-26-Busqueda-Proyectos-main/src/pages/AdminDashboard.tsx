import { useProyectos, useSolicitudesEnviadas } from '@/features/proyectos';
import { useEmpresas } from '@/features/empresas';
import { useUsuarios } from '@/features/usuarios';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Card } from '@/shared/components/ui/Card';
import { Link } from 'react-router';
import { Building2, FolderKanban, Users, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminDashboard() {
  const { data: companies = [] } = useEmpresas();
  const { data: projects = [] } = useProyectos();
  const { data: requests = [] } = useSolicitudesEnviadas(true);
  const { data: users = [] } = useUsuarios(true);

  const approvedCompanies = companies.filter(c => c.estado === 'aprobado').length;
  const pendingCompanies = companies.filter(c => c.estado === 'pendiente').length;
  const totalProjects = projects.length;
  const pendingRequests = requests.filter(r => r.estado === 'pendiente').length;

  const stats = [
    {
      label: 'Total Empresas',
      value: companies.length,
      subtext: `${approvedCompanies} aprobadas`,
      icon: Building2,
      color: 'bg-primary',
      link: '/admin/companies'
    },
    {
      label: 'Total Proyectos',
      value: totalProjects,
      subtext: 'Activos en la plataforma',
      icon: FolderKanban,
      color: 'bg-primary',
      link: '/admin/projects'
    },
    {
      label: 'Empresas Pendientes',
      value: pendingCompanies,
      subtext: 'Requieren aprobación',
      icon: Users,
      color: 'bg-warning',
      link: '/admin/companies?filter=pending'
    },
    {
      label: 'Usuarios Registrados',
      value: users.length,
      subtext: 'En la plataforma',
      icon: Users,
      color: 'bg-primary',
      link: '/admin/users'
    }
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
    <AppLayout isAdmin mainClassName="flex-1 p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground">
              Gestiona empresas, proyectos y usuarios de la plataforma
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={stat.link}>
                    <Card hover className="p-6 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${stat.color === 'bg-muted' ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold mb-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
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

          {/* Recent Companies */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Empresas Recientes</h3>
            <div className="space-y-3">
              {[...companies]
                .sort((a, b) => new Date(b.fecha_registro || 0).getTime() - new Date(a.fecha_registro || 0).getTime())
                .slice(0, 5).map(company => (
                <Link 
                  key={company.id}
                  to={`/admin/companies/${company.id}/review`}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.nombre}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{company.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        {company.descripcion?.substring(0, 50)}...
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      company.estado === 'aprobado' 
                        ? 'bg-success/10 text-success' 
                        : company.estado === 'pendiente'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {company.estado === 'aprobado' ? 'Aprobada' : 
                       company.estado === 'pendiente' ? 'Pendiente' : 'Bloqueada'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Recent Projects */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Proyectos Recientes</h3>
            <div className="space-y-3">
              {[...projects]
                .sort((a, b) => new Date(b.fecha_creacion || b.fecha_inicio || 0).getTime() - new Date(a.fecha_creacion || a.fecha_inicio || 0).getTime())
                .slice(0, 5).map(project => {
                const creator = users.find(u => u.id === project.creador_id);
                const company = companies.find(c => c.id === creator?.empresa_id);
                return (
                  <Link 
                    key={project.id}
                    to={`/project/${project.id}`}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {project.nombre}
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            {project.categoria || 'Tecnología'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          por {creator?.nombre_completo}{company ? ` · ${company.nombre}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {project.participantes?.length || 0} colaboradores
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
    </AppLayout>
  );
}
