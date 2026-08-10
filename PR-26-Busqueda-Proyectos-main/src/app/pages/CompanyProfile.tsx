import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  Building2, User, FileText, Eye, Download,
  Mail, Briefcase, Shield, Crown, Users,
  CheckCircle2, Clock, AlertCircle, Calendar,
} from 'lucide-react';
import { motion } from 'motion/react';

function InfoRow({ icon: Icon, label, value, color = 'text-muted-foreground' }: {
  icon: any; label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors">
      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function CompanyProfile() {
  const { currentUser, companies, openBase64 } = useApp();

  const userCompany = companies.find(c => c.id === currentUser?.empresa_id);

  // El listado ya no trae documento_url (para no cargar todos los documentos al abrir la app);
  // se pide puntual aquí, solo al mostrar el perfil de la empresa.
  const [companyDocUrl, setCompanyDocUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!userCompany) return;
    api.get<{ documento_url?: string }>(`/empresas/${userCompany.id}`)
      .then(data => setCompanyDocUrl(data.documento_url))
      .catch(() => {});
  }, [userCompany?.id]);

  const rolConfig = {
    superadmin: { label: 'Administrador del Sistema', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100' },
    admin:      { label: 'Administrador de Empresa',  icon: Crown,  color: 'text-blue-600',   bg: 'bg-blue-100'   },
    empleado:   { label: 'Empleado',                  icon: Users,  color: 'text-slate-600',  bg: 'bg-slate-100'  },
  };
  const rol = rolConfig[currentUser?.rol || 'empleado'];
  const RolIcon = rol.icon;

  const estadoCompany = {
    aprobado: { label: 'Empresa Aprobada', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    pendiente: { label: 'Pendiente de Aprobación', icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
    bloqueado: { label: 'Empresa Bloqueada',       icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'    },
    rechazado: { label: 'Empresa Rechazada',       icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'    },
  };
  const companyEstado = estadoCompany[userCompany?.estado || 'pendiente'];
  const EstadoIcon = companyEstado.icon;

  const initials = currentUser?.nombre_completo
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 py-10 px-6">

          {/* Page header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mi Perfil</h1>
              <p className="text-muted-foreground text-sm">Tu información personal y datos de empresa</p>
            </div>
          </motion.div>

          <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-6">

            {/* LEFT: User card */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              className="lg:col-span-1 space-y-4">

              {/* Avatar + Name */}
              <Card className="p-6 border-none shadow-md text-center overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-primary/20 to-secondary/20" />
                <div className="relative pt-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-black shadow-xl mx-auto mb-4">
                    {initials}
                  </div>
                  <h2 className="text-xl font-bold">{currentUser?.nombre_completo}</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">{currentUser?.correo}</p>

                  {/* Rol badge */}
                  <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-bold ${rol.bg} ${rol.color}`}>
                    <RolIcon className="w-3.5 h-3.5" />
                    {rol.label}
                  </div>
                </div>

                {/* Company status badge */}
                {userCompany && (
                  <div className={`mt-4 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${companyEstado.bg} ${companyEstado.color} ${companyEstado.border}`}>
                    <EstadoIcon className="w-3.5 h-3.5" />
                    {companyEstado.label}
                  </div>
                )}
              </Card>

              {/* Personal Document */}
              {currentUser?.documento_url && (
                <Card className="p-5 border-none shadow-md">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Documento Personal</h3>
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">Documento de Identidad</p>
                      <p className="text-xs text-muted-foreground">PDF adjunto</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openBase64(currentUser.documento_url!)}
                        className="w-8 h-8 rounded-lg hover:bg-primary/10 flex items-center justify-center text-primary transition-colors"
                        title="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a href={currentUser.documento_url} download="documento.pdf"
                        className="w-8 h-8 rounded-lg hover:bg-primary/10 flex items-center justify-center text-primary transition-colors"
                        title="Descargar">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>

            {/* RIGHT: Details */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-4">

              {/* Personal Info */}
              <Card className="border-none shadow-md overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-bold">Datos Personales</h2>
                </div>
                <div className="p-4 grid sm:grid-cols-2 gap-1">
                  <InfoRow icon={User}     label="Nombre Completo" value={currentUser?.nombre_completo || ''} />
                  <InfoRow icon={Mail}     label="Correo Electrónico" value={currentUser?.correo || ''} />
                  <InfoRow icon={Briefcase} label="Cargo"          value={currentUser?.cargo || 'No especificado'} />
                  <InfoRow icon={RolIcon}  label="Rol en Plataforma" value={rol.label} color={rol.color} />
                </div>
              </Card>

              {/* Company Info */}
              {userCompany && (
                <Card className="border-none shadow-md overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-secondary/5 to-transparent">
                    <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-secondary" />
                    </div>
                    <h2 className="font-bold">Datos de la Empresa</h2>
                    <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full border ${companyEstado.bg} ${companyEstado.color} ${companyEstado.border}`}>
                      {userCompany.estado?.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-4 grid sm:grid-cols-2 gap-1">
                    <InfoRow icon={Building2} label="Nombre de Empresa" value={userCompany.nombre} />
                    <InfoRow icon={Users}     label="Número de Empleados" value={userCompany.num_empleados?.toString() || '—'} />
                    <InfoRow icon={Calendar}  label="Fecha de Registro"
                      value={userCompany.fecha_registro ? new Date(userCompany.fecha_registro).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'} />
                    <InfoRow icon={CheckCircle2} label="Fecha de Aprobación"
                      value={userCompany.fecha_aprobacion ? new Date(userCompany.fecha_aprobacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Pendiente'} />
                  </div>

                  {userCompany.descripcion && (
                    <div className="px-6 pb-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Descripción</p>
                      <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-xl p-4">{userCompany.descripcion}</p>
                    </div>
                  )}

                  {userCompany.portafolio && (
                    <div className="px-6 pb-5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Portafolio / Experiencia</p>
                      <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-xl p-4 italic">"{userCompany.portafolio}"</p>
                    </div>
                  )}

                  {/* Company document */}
                  {companyDocUrl && (
                    <div className="px-6 pb-5 border-t border-border pt-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Documento de Empresa</p>
                      <div className="flex items-center gap-3 p-3 bg-secondary/5 border border-secondary/20 rounded-xl">
                        <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">Acreditación Empresarial</p>
                          <p className="text-xs text-muted-foreground">NIT / Matrícula de Comercio</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openBase64(companyDocUrl)}
                            className="w-8 h-8 rounded-lg hover:bg-secondary/10 flex items-center justify-center text-secondary transition-colors"
                            title="Ver"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a href={companyDocUrl} download="documento-empresa.pdf"
                            className="w-8 h-8 rounded-lg hover:bg-secondary/10 flex items-center justify-center text-secondary transition-colors"
                            title="Descargar">
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* No company */}
              {!userCompany && (
                <Card className="border-none shadow-md p-8 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No estás asociado a ninguna empresa</p>
                </Card>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
