import { useApp } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
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
  X,
  ChevronRight,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { MemberRequest } from '../context/AppContext';


export default function CompanyMembers() {
  const {
    currentUser,
    users,
    companies,
    memberRequests,
    approveMemberRequest,
    rejectMemberRequest,
    deleteMemberRequest,
    promoteToAdmin,
    demoteToUser,
    deleteUser,
    openBase64,
  } = useApp();

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
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
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
                { label: 'Miembros Activos', value: companyMembers.length, color: 'from-primary to-secondary', icon: Users },
                { label: 'Solicitudes Pendientes', value: pendingRequests.length, color: pendingRequests.length > 0 ? 'from-warning to-orange-500' : 'from-slate-300 to-slate-400', icon: Clock },
                { label: 'Aprobadas', value: approvedRequests.length, color: 'from-success to-emerald-600', icon: CheckCircle2 },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card className="p-5 border-none shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400 font-medium mb-0.5">{stat.label}</p>
                          <p className="text-3xl font-black">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md relative`}>
                          <Icon className="w-6 h-6 text-white" />
                          {stat.label === 'Solicitudes Pendientes' && stat.value > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
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
                                  <div className="w-14 h-14 bg-gradient-to-br from-warning to-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
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
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0 ${isAdmin ? 'bg-gradient-to-br from-primary to-purple-500' : 'bg-gradient-to-br from-success to-emerald-600'}`}>
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
          <AnimatePresence>
            {selectedRequest && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedRequest(null)}
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
                    {/* Modal header stripe */}
                    <div className="relative p-6 bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-b border-border">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-black">Solicitud de Membresía</h2>
                          <p className="text-muted-foreground text-sm mt-0.5">Revisión completa del solicitante</p>
                        </div>
                        <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                          <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Left: personal info */}
                        <div>
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Datos Personales</h3>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-warning to-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
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

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-4 border-t border-border">
                        <Button
                          variant="primary"
                          className="flex-1 flex items-center justify-center gap-2 py-5 font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
                          onClick={() => { approveMemberRequest(selectedRequest.id); setSelectedRequest(null); }}
                        >
                          <UserCheck className="w-5 h-5" /> Aprobar Solicitud
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 flex items-center justify-center gap-2 py-5 text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => { rejectMemberRequest(selectedRequest.id); setSelectedRequest(null); }}
                        >
                          <UserX className="w-5 h-5" /> Rechazar
                        </Button>
                        <Button variant="ghost" className="px-4" onClick={() => setSelectedRequest(null)}>
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── GORGEOUS PREMIUM DELETE CONFIRMATION MODAL ── */}
          <AnimatePresence>
            {requestToDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setRequestToDelete(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', duration: 0.4 }}
                  className="max-w-md w-full"
                  onClick={e => e.stopPropagation()}
                >
                  <Card className="border-none shadow-2xl overflow-hidden relative">
                    {/* Upper decorative warning bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
                    
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 shadow-inner">
                        <AlertTriangle className="w-8 h-8 animate-bounce-slow" />
                      </div>
                      
                      <h2 className="text-2xl font-black text-slate-800 mb-3">¿Eliminar Registro de Rechazo?</h2>
                      
                      <p className="text-sm text-slate-500 leading-relaxed mb-6">
                        Si eliminas el rechazo de <strong className="text-slate-700">{requestToDelete.usuario?.nombre_completo}</strong>, 
                        su cuenta y datos se borrarán por completo de la base de datos.
                        <br />
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200 mt-3 inline-block font-semibold">
                          ⚠️ Esto permitirá que el usuario pueda registrarse y volver a solicitar unirse a tu empresa.
                        </span>
                      </p>

                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          className="flex-1 py-3 text-slate-500 hover:bg-slate-100 font-bold"
                          onClick={() => setRequestToDelete(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="primary"
                          className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold shadow-lg shadow-red-500/20"
                          onClick={() => {
                            deleteMemberRequest(requestToDelete.id);
                            setRequestToDelete(null);
                            toast.success('Registro de rechazo eliminado exitosamente. El usuario ya puede volver a aplicar.');
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
