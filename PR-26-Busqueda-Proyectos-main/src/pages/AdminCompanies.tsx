import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useEmpresas } from '@/features/empresas';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Building2, Search, Users, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { EstadoVacio, EstadoError } from '@/shared/components/feedback';

export default function AdminCompanies() {
  const { data: companies = [], isError, refetch } = useEmpresas();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'blocked' | 'rejected'>((searchParams.get('filter') as any) || 'all');

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'pending'   ? company.estado === 'pendiente'  : 
       filter === 'approved'  ? company.estado === 'aprobado'   : 
       filter === 'blocked'   ? company.estado === 'bloqueado'  :
       filter === 'rejected'  ? company.estado === 'rechazado'  : true);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    const dateA = new Date(a.fecha_registro || 0).getTime();
    const dateB = new Date(b.fecha_registro || 0).getTime();
    return dateB - dateA;
  });

  return (
    <AppLayout isAdmin mainClassName="flex-1 p-8">
      <Breadcrumbs items={[{ label: "Panel", to: "/admin" }, { label: "Empresas" }]} />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">Gestión de Empresas</h1>
            <p className="text-muted-foreground">
              Aprobar, bloquear o eliminar empresas registradas
            </p>
          </motion.div>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Filters */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    aria-label="Buscar empresas" placeholder="Buscar empresas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'pending', 'approved', 'blocked', 'rejected'] as const).map(f => (
                    <Button
                      key={f}
                      variant={filter === f ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter(f)}
                    >
                      {f === 'all'      ? 'Todas' : 
                       f === 'pending'  ? 'Pendientes' :
                       f === 'approved' ? 'Aprobadas' : 
                       f === 'blocked'  ? 'Bloqueadas' : 'Rechazadas'}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Companies List */}
            <div className="space-y-4">
              {filteredCompanies.map(comp => (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="p-6 transition-all border-none bg-card shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-6">
                      {comp.logo_url ? (
                        <img src={comp.logo_url} alt={comp.nombre} className="w-20 h-20 rounded-xl object-cover shadow-sm" />
                      ) : (
                        <div className="w-20 h-20 bg-primary/5 rounded-xl flex items-center justify-center border border-border">
                          <Building2 className="w-10 h-10 text-primary/40" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-xl">{comp.nombre}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            comp.estado === 'aprobado' 
                              ? 'bg-success/10 text-success' 
                              : comp.estado === 'pendiente'
                              ? 'bg-warning/10 text-warning'
                              : comp.estado === 'bloqueado'
                              ? 'bg-warning-subtle text-warning-strong'
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {comp.estado === 'aprobado'  ? 'Aprobada'  : 
                             comp.estado === 'pendiente' ? 'Pendiente' : 
                             comp.estado === 'bloqueado' ? 'Bloqueada' : 'Rechazada'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                          {comp.descripcion}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                          <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {comp.num_empleados} empleados</div>
                          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Solicitada el: {new Date(comp.fecha_registro || Date.now()).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 min-w-[160px]">
                        <Link to={`/admin/companies/${comp.id}/review`} className="w-full">
                          <Button variant="primary" className="w-full text-xs font-bold py-5">
                            {comp.estado === 'pendiente' ? 'REVISAR SOLICITUD' : 'VER / GESTIONAR'}
                          </Button>
                        </Link>
                        {comp.estado === 'aprobado' && (
                          <Link to={`/admin/companies/${comp.id}/users`} className="w-full">
                            <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold py-4">
                              GESTIONAR EQUIPO
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {isError ? (
                <EstadoError
                  titulo="No pudimos cargar las empresas"
                  onReintentar={() => refetch()}
                />
              ) : filteredCompanies.length === 0 && (
                <EstadoVacio
                  icono={Building2}
                  titulo="No se encontraron empresas"
                  descripcion="Ajusta los filtros o el término de búsqueda para ver otras empresas registradas."
                />
              )}
            </div>
          </div>
    </AppLayout>
  );
}
