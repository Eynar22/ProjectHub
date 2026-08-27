import { useParams, useNavigate, Link } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useEmpresa, useModerarEmpresa } from '@/features/empresas';
import { useUsuario } from '@/features/usuarios';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { 
  Building2, 
  User, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Briefcase, 
  Mail, 
  Calendar, 
  Users, 
  Info,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminCompanyRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, openBase64 } = useApp();
  const { data: company } = useEmpresa(id);
  const moderar = useModerarEmpresa();

  const registrant = users.find(u => u.empresa_id === Number(id) && u.rol === 'admin')
    || company?.usuarios?.find(u => u.rol === 'admin');

  // El detalle de empresa ya trae documento_url; el del registrante se pide
  // por su id (el listado de usuarios no lo incluye).
  const companyDoc = company?.documento_url;
  const registrantDoc = useUsuario(registrant?.id).data?.documento_url;

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-4">Empresa no encontrada</h1>
        <Link to="/admin/companies">
          <Button variant="primary">Volver al Panel</Button>
        </Link>
      </div>
    );
  }

  return (
    <AppLayout isAdmin mainClassName="flex-1 p-8">
      <Breadcrumbs items={[{ label: "Panel", to: "/admin" }, { label: "Empresas", to: "/admin/companies" }, { label: "Revisar solicitud" }]} />
          <div className="max-w-5xl mx-auto">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => navigate('/admin/companies')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="font-medium">Volver a Empresas</span>
              </button>
              
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase ${
                  company.estado === 'aprobado' 
                    ? 'bg-success/10 text-success border border-success/20' 
                    : company.estado === 'pendiente'
                    ? 'bg-warning/10 text-warning border border-warning/20 animate-pulse'
                    : company.estado === 'bloqueado'
                    ? 'bg-warning-subtle text-warning-strong border border-warning/30'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}>
                  {company.estado === 'aprobado' ? '✓ Aprobada' : 
                   company.estado === 'pendiente' ? '⏳ Pendiente' : 
                   company.estado === 'bloqueado' ? '⛔ Bloqueada' : 
                   '✗ Rechazada'}
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Section: Company Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-8 border-none shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <div className="flex items-start gap-6 mb-8">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.nombre} className="w-24 h-24 rounded-2xl object-cover shadow-md" />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center border border-primary/20">
                          <Building2 className="w-10 h-10 text-primary" />
                        </div>
                      )}
                      <div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">{company.nombre}</h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">{company.descripcion}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-border">
                      <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Información Corporativa</h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg"><Users className="w-4 h-4 text-muted-foreground" /></div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Tamaño del Equipo</p>
                              <p className="text-sm font-bold">{company.num_empleados} empleados</p>
                            </div>
                          </div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg"><Calendar className="w-4 h-4 text-muted-foreground" /></div>
                              <div>
                                <p className="text-xs text-muted-foreground font-medium">Fecha de Solicitud</p>
                                <p className="text-sm font-bold">{company.fecha_registro ? new Date(company.fecha_registro).toLocaleDateString() : 'Reciente'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg">
                                <ShieldCheck className={`w-4 h-4 ${company.estado === 'aprobado' ? 'text-success' : 'text-muted-foreground'}`} />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-medium">Fecha de Aprobación</p>
                                <p className={`text-sm font-bold ${company.estado === 'aprobado' ? 'text-success' : 'text-warning'}`}>
                                  {company.fecha_aprobacion ? new Date(company.fecha_aprobacion).toLocaleDateString() : 'Aún Pendiente'}
                                </p>
                              </div>
                            </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Experiencia y Portafolio</h3>
                        <div className="bg-muted rounded-xl p-4 border border-border">
                          <p className="text-sm leading-relaxed text-muted-foreground italic">
                            "{company.portafolio}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Section: Documentation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-8 border-none shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-secondary" />
                      Documentación Legal Adjunta
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { title: 'Acreditación de Empresa', hint: 'NIT, Matrícula de Comercio', file: companyDoc || '#' },
                        { title: 'Pertenencia Personal', hint: 'Verificación del responsable', file: registrantDoc || '#' },
                      ].map((doc, i) => (
                        <div 
                          key={i} 
                          onClick={() => openBase64(doc.file)}
                          className="group p-5 bg-muted rounded-2xl border border-border hover:border-secondary/50 hover:bg-card transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-card rounded-xl shadow-sm border border-border text-secondary group-hover:scale-110 transition-transform">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-[10px] font-bold px-2 py-1 bg-secondary/10 text-secondary rounded-lg uppercase tracking-tight">PDF</div>
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground mb-1">{doc.title}</h3>
                            <p className="text-xs text-muted-foreground mb-4">{doc.hint}</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase group-hover:underline">
                              <ExternalLink className="w-3 h-3" />
                              VER DOCUMENTO
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column: Registrant & Stats */}
              <div className="space-y-8 text-left">
                {registrant && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="p-6 border-none shadow-sm overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-success" />
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 px-2">Responsable de Solicitud</h3>
                      
                      <div className="flex flex-col items-center text-center px-2">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-4 border-2 border-white shadow-lg overflow-hidden">
                          <span className="text-3xl font-black text-success">{registrant.nombre_completo.charAt(0).toUpperCase()}</span>
                        </div>
                        <h4 className="text-xl font-bold text-foreground mb-1">{registrant.nombre_completo}</h4>
                        <div className="flex items-center gap-1.5 text-success mb-6">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-xs font-black uppercase tracking-widest leading-none pt-0.5">Admin Designado</span>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg"><Briefcase className="w-4 h-4 text-muted-foreground" /></div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Cargo Actual</p>
                            <p className="text-sm font-bold">{registrant.cargo || 'No especificado'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg"><Mail className="w-4 h-4 text-muted-foreground" /></div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Correo Electrónico</p>
                            <p className="text-sm font-bold truncate max-w-[180px]">{registrant.correo}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Actions Sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="p-6 border-none shadow-lg bg-card relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full" />
                    <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Decisión Administrativa
                    </h3>
                    
                    <div className="space-y-3">
                      {/* PENDIENTE: Aprobar o Rechazar */}
                      {company.estado === 'pendiente' && (
                        <Button 
                          variant="success" 
                          className="w-full py-6 flex items-center justify-center gap-3 text-primary-foreground font-bold text-lg shadow-lg shadow-success/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          onClick={async () => {
                            await moderar.mutateAsync({ id: company.id, accion: 'aprobar' });
                            navigate('/admin/companies');
                          }}
                        >
                          <CheckCircle2 className="w-6 h-6" />
                          APROBAR REGISTRO
                        </Button>
                      )}

                      {/* RECHAZADO: Dar segunda oportunidad */}
                      {company.estado === 'rechazado' && (
                        <Button 
                          variant="success" 
                          className="w-full py-6 flex items-center justify-center gap-3 text-primary-foreground font-bold shadow-lg shadow-success/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          onClick={async () => {
                            await moderar.mutateAsync({ id: company.id, accion: 'aprobar' });
                            navigate('/admin/companies');
                          }}
                        >
                          <CheckCircle2 className="w-6 h-6" />
                          APROBAR DE TODAS FORMAS
                        </Button>
                      )}

                      {/* APROBADO: Bloquear */}
                      {company.estado === 'aprobado' && (
                        <Button 
                          variant="warning" 
                          className="w-full py-6 flex items-center justify-center gap-3"
                          onClick={async () => {
                            await moderar.mutateAsync({ id: company.id, accion: 'bloquear' });
                            navigate('/admin/companies');
                          }}
                        >
                          <XCircle className="w-5 h-5" />
                          Bloquear Empresa
                        </Button>
                      )}

                      {/* BLOQUEADO: Desbloquear */}
                      {company.estado === 'bloqueado' && (
                        <Button 
                          variant="success" 
                          className="w-full py-6 flex items-center justify-center gap-3 shadow-lg shadow-success/20"
                          onClick={async () => {
                            await moderar.mutateAsync({ id: company.id, accion: 'desbloquear' });
                            navigate('/admin/companies');
                          }}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Desbloquear Empresa
                        </Button>
                      )}

                      {/* PENDIENTE: Rechazar (solo si aún no fue procesada) */}
                      {company.estado === 'pendiente' && (
                        <Button 
                          variant="outline" 
                          className="w-full py-4 flex items-center justify-center gap-2 border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-all"
                          onClick={async () => {
                            if (confirm('¿Rechazar esta solicitud? Se notificará al responsable por correo.')) {
                              await moderar.mutateAsync({ id: company.id, accion: 'eliminar' });
                              navigate('/admin/companies');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Rechazar Solicitud
                        </Button>
                      )}
                    </div>

                    <div className="mt-8 p-4 bg-muted rounded-xl border border-border">
                      <div className="flex gap-3">
                        <Info className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <p className="text-[10px] text-muted-foreground leading-normal">
                          {company.estado === 'pendiente' && 'Al aprobar, el responsable recibirá un correo y podrá comenzar a publicar proyectos en nombre de la empresa.'}
                          {company.estado === 'aprobado' && 'Al bloquear, la empresa y sus usuarios no podrán iniciar sesión hasta que sea desbloqueada.'}
                          {company.estado === 'bloqueado' && 'Al desbloquear, la empresa volverá a estar activa y sus usuarios podrán iniciar sesión nuevamente.'}
                          {company.estado === 'rechazado' && 'Esta solicitud fue rechazada. La empresa y sus usuarios recibieron una notificación por correo.'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
    </AppLayout>
  );
}
