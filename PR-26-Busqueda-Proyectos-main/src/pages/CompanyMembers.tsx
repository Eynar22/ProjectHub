import { useApp } from '@/app/context/AppContext';
import { useEmpresas } from '@/features/empresas';
import type { MemberRequest } from '@/features/empresas';
import {
  useUsuarios,
  useModerarUsuario,
  useSolicitudesMembresia,
  useResponderSolicitudMembresia,
  useEliminarSolicitudMembresia,
} from '@/features/usuarios';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { Modal } from '@/shared/components/ui/Modal';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import {
  UserCheck,
  UserX,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileText,
  ExternalLink,
  Mail,
  Briefcase,
  ChevronRight,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';


export default function CompanyMembers() {
  const { currentUser, openBase64 } = useApp();
  const { data: companies = [] } = useEmpresas();
  const { data: users = [] } = useUsuarios(!!currentUser);
  const esAdmin = currentUser?.rol === 'admin';
  const { data: memberRequests = [] } = useSolicitudesMembresia(currentUser?.empresa_id, esAdmin);
  const moderar = useModerarUsuario();
  const responderSolicitud = useResponderSolicitudMembresia();
  const eliminarSolicitud = useEliminarSolicitudMembresia();

  const approveMemberRequest = (id: number) => responderSolicitud.mutate({ solicitudId: id, accion: 'aprobar' });
  const rejectMemberRequest = (id: number) => responderSolicitud.mutate({ solicitudId: id, accion: 'rechazar' });
  const deleteMemberRequest = (id: number) => eliminarSolicitud.mutate(id);
  const promoteToAdmin = (id: number) => moderar.mutate({ id, accion: 'promover' });
  const demoteToUser = (id: number) => moderar.mutate({ id, accion: 'degradar' });

  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<MemberRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<MemberRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'pendiente' | 'miembros' | 'rechazado'>('pendiente');

  useEffect(() => {
    if (currentUser && currentUser.rol !== 'admin') navigate('/dashboard');
  }, [currentUser, navigate]);

  const userCompany = companies.find(c => c.id === currentUser?.empresa_id);
  const companyMembers = users.filter(u => u.empresa_id === currentUser?.empresa_id && u.id !== currentUser?.id && u.estado !== 'pendiente' && u.estado !== 'rechazado');
  const pendingRequests = memberRequests.filter(mr => mr.empresa_id === currentUser?.empresa_id && mr.estado === 'pendiente');
  const approvedRequests = memberRequests.filter(mr => mr.empresa_id === currentUser?.empresa_id && mr.estado === 'aprobado');
  const rejectedRequests = memberRequests.filter(mr => mr.empresa_id === currentUser?.empresa_id && mr.estado === 'rechazado');

  const tabs = [
    { id: 'pendiente' as const, label: 'Solicitudes Pendientes', count: pendingRequests.length, icon: Clock, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    { id: 'miembros' as const, label: 'Miembros Activos', count: companyMembers.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { id: 'rechazado' as const, label: 'Rechazadas', count: rejectedRequests.length, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  ];

  return (
    <AppLayout mainClassName="flex-1 p-8">
      <Breadcrumbs items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Gestión de miembros" }]} />
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-4xl font-black tracking-tight mb-1">Gestión de Miembros</h1>
              <p className="text-muted-foreground">
                Administra los usuarios de <strong>{userCompany?.nombre}</strong>
              </p>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Miembros Activos', value: companyMembers.length, color: 'bg-primary', icon: Users },
                { label: 'Solicitudes Pendientes', value: pendingRequests.length, color: pendingRequests.length > 0 ? 'bg-warning' : 'bg-muted', icon: Clock },
                { label: 'Aprobadas', value: approvedRequests.length, color: 'bg-success', icon: CheckCircle2 },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card className="p-5 border-none shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-0.5">{stat.label}</p>
                          <p className="text-3xl font-black">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center shadow-md relative`}>
                          <Icon className="w-6 h-6 text-primary-foreground" />
                          {stat.label === 'Solicitudes Pendientes' && stat.value > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                              {stat.value}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tab.bg} ${tab.color}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── TAB: PENDING REQUESTS ── */}
            <AnimatePresence mode="wait">
              {activeTab === 'pendiente' && (
                <motion.div key="pending" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {pendingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {pendingRequests.map((mr, i) => (
                        <motion.div key={mr.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                          <Card className="p-0 border-none shadow-sm overflow-hidden relative hover:shadow-md transition-all">
                            <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
                            <div className="p-6 pl-7">
                              <div className="flex items-start gap-5 justify-between">
                                {/* Left: avatar + info */}
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                  <div className="w-14 h-14 bg-warning rounded-2xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-md flex-shrink-0">
                                    {mr.usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-bold text-lg">{mr.usuario?.nombre_completo}</p>
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-warning/10 text-warning rounded-full border border-warning/20 uppercase tracking-wide">
                                        Pendiente
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                      <Mail className="w-3.5 h-3.5" />
                                      {mr.usuario?.correo}
                                    </div>
                                    {mr.usuario?.cargo && (
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                                          {mr.usuario.cargo}
                                        </span>
                                      </div>
                                    )}

                                    {/* Document & date row */}
                                    <div className="flex items-center gap-4 mt-3">
                                      {mr.documento_url ? (
                                        <button
                                          onClick={() => openBase64(mr.documento_url!)}
                                          className="group flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-primary transition-colors"
                                        >
                                          <div className="p-1.5 bg-secondary/10 rounded-lg group-hover:bg-primary/10 transition-colors">
                                            <FileText className="w-3.5 h-3.5" />
                                          </div>
                                          <ExternalLink className="w-3 h-3" />
                                          Ver Documento
                                        </button>
                                      ) : (
                                        <span className="text-xs text-muted-foreground italic">Sin documento adjunto</span>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(mr.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: actions */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1.5 text-xs whitespace-nowrap"
                                    onClick={() => setSelectedRequest(mr)}
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" /> Ver Detalles
                                    <ChevronRight className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="success"
                                    size="sm"
                                    className="flex items-center gap-1.5 text-xs font-bold shadow-sm shadow-success/20 hover:scale-[1.02] transition-all"
                                    onClick={() => approveMemberRequest(mr.id)}
                                  >
                                    <UserCheck className="w-3.5 h-3.5" /> APROBAR
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
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-16 text-center border-none shadow-sm">
                      <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">¡Todo al día!</h3>
                      <p className="text-muted-foreground text-sm">No hay solicitudes pendientes de revisión.</p>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* ── TAB: ACTIVE MEMBERS ── */}
              {activeTab === 'miembros' && (
                <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {companyMembers.length > 0 ? (
                    <div className="space-y-4">
                      {companyMembers.map((member, i) => {
                        const isAdmin = member.rol === 'admin';
                        return (
                          <motion.div key={member.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="p-0 border-none shadow-sm overflow-hidden relative hover:shadow-md transition-all">
                              <div className={`absolute top-0 left-0 w-1 h-full ${isAdmin ? 'bg-primary' : 'bg-success'}`} />
                              <div className="p-6 pl-7">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-md flex-shrink-0 ${isAdmin ? 'bg-primary' : 'bg-success'}`}>
                                      {member.nombre_completo.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-lg">{member.nombre_completo}</p>
                                        {isAdmin && (
                                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 uppercase tracking-wide">
                                            <ShieldCheck className="w-3 h-3" /> Admin
                                          </span>
                                        )}
                                        {member.estado === 'bloqueado' && (
                                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-destructive/10 text-destructive rounded-full border border-destructive/20 uppercase tracking-wide">
                                            <Lock className="w-3 h-3" /> Bloqueado
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        {member.correo}
                                      </div>
                                      {member.cargo && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">{member.cargo}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                      {isAdmin ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive transition-all"
                                          onClick={() => demoteToUser(member.id)}
                                        >
                                          <UserX className="w-3.5 h-3.5" /> Quitar Admin
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1.5 text-xs text-primary border-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={member.estado === 'bloqueado'}
                                          title={member.estado === 'bloqueado' ? 'No se puede promover a un usuario bloqueado' : ''}
                                          onClick={() => promoteToAdmin(member.id)}
                                        >
                                          <ShieldCheck className="w-3.5 h-3.5" /> Hacer Admin
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="p-16 text-center border-none shadow-sm">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Sin miembros aún</h3>
                      <p className="text-muted-foreground text-sm">Los usuarios aprobados de tu empresa aparecerán aquí.</p>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* ── TAB: REJECTED ── */}
              {activeTab === 'rechazado' && (
                <motion.div key="rejected" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {rejectedRequests.length > 0 ? (
                    <div className="space-y-3">
                      {rejectedRequests.map((mr, i) => (
                        <motion.div key={mr.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="p-0 border-none shadow-sm overflow-hidden relative opacity-60 hover:opacity-80 transition-opacity">
                            <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                            <div className="p-5 pl-7 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-muted rounded-full flex items-center justify-center font-bold text-muted-foreground text-sm">
                                  {mr.usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                                </div>
                                <div>
                                  <p className="font-semibold">{mr.usuario?.nombre_completo}</p>
                                  <p className="text-sm text-muted-foreground">{mr.usuario?.correo}</p>
                                  {mr.usuario?.cargo && <p className="text-xs text-muted-foreground">{mr.usuario.cargo}</p>}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => setRequestToDelete(mr)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-16 text-center border-none shadow-sm">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Sin rechazos</h3>
                      <p className="text-muted-foreground text-sm">No hay solicitudes rechazadas.</p>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── DETAIL MODAL ── */}
          <Modal
            open={!!selectedRequest}
            onClose={() => setSelectedRequest(null)}
            titulo="Solicitud de membresía"
            size="lg"
            acciones={selectedRequest ? (
              <>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => { rejectMemberRequest(selectedRequest.id); setSelectedRequest(null); }}
                >
                  <UserX className="w-4 h-4" aria-hidden="true" /> Rechazar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => { approveMemberRequest(selectedRequest.id); setSelectedRequest(null); }}
                >
                  <UserCheck className="w-4 h-4" aria-hidden="true" /> Aprobar solicitud
                </Button>
              </>
            ) : undefined}
          >
            {selectedRequest && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Left: personal info */}
                        <div>
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Datos Personales</h3>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-warning rounded-2xl flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg">
                              {selectedRequest.usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <p className="font-bold text-lg">{selectedRequest.usuario?.nombre_completo}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-warning/10 text-warning rounded-full border border-warning/20 uppercase">
                                Pendiente
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Correo</p>
                                <p className="text-sm font-semibold">{selectedRequest.usuario?.correo}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                              <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Cargo</p>
                                <p className="text-sm font-semibold">{selectedRequest.usuario?.cargo || 'No especificado'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Fecha de Solicitud</p>
                                <p className="text-sm font-semibold">
                                  {new Date(selectedRequest.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: documentation */}
                        <div>
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Documentación</h3>
                          {selectedRequest.documento_url ? (
                            <div
                              onClick={() => openBase64(selectedRequest.documento_url!)}
                              className="group p-5 bg-muted/50 rounded-2xl border border-border hover:border-primary/50 hover:bg-background transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-background rounded-xl shadow-sm border border-border text-primary group-hover:scale-110 transition-transform">
                                  <FileText className="w-6 h-6" />
                                </div>
                                <div className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-tight">DOC</div>
                              </div>
                              <h4 className="font-bold mb-1">Documento de Pertenencia</h4>
                              <p className="text-xs text-muted-foreground mb-4">Adjuntado por el solicitante como prueba de pertenencia</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase group-hover:underline">
                                <ExternalLink className="w-3 h-3" /> VER DOCUMENTO
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

          {/* ── Confirmación de eliminación ── */}
          <Modal
            open={!!requestToDelete}
            onClose={() => setRequestToDelete(null)}
            titulo="¿Eliminar registro de rechazo?"
            size="sm"
            acciones={
              <>
                <Button variant="ghost" onClick={() => setRequestToDelete(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (requestToDelete) deleteMemberRequest(requestToDelete.id);
                    setRequestToDelete(null);
                  }}
                >
                  Eliminar
                </Button>
              </>
            }
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-subtle text-danger-strong">
                <AlertTriangle className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground">
                Si eliminas el rechazo de{' '}
                <strong className="text-foreground">{requestToDelete?.usuario?.nombre_completo}</strong>,
                su cuenta y datos se borrarán por completo de la base de datos.
              </p>
              <p className="rounded-lg border border-warning/30 bg-warning-subtle px-3 py-2 text-xs font-semibold text-warning-strong">
                ⚠️ Esto permitirá que el usuario pueda registrarse y volver a solicitar unirse a tu empresa.
              </p>
            </div>
          </Modal>
    </AppLayout>
  );
}
