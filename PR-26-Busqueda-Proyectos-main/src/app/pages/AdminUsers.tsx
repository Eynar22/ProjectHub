import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Search, Shield, UserCheck, Lock, Unlock, UserMinus,
  Building2, ChevronDown, Crown, User as UserIcon, AlertTriangle,
} from 'lucide-react';

const ROL_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  superadmin: { label: 'Super Admin', bg: 'bg-purple-100', text: 'text-purple-700', icon: Shield },
  admin:      { label: 'Admin',       bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Crown },
  empleado:   { label: 'Empleado',    bg: 'bg-slate-100',  text: 'text-slate-600',  icon: UserIcon },
};

const ESTADO_CFG: Record<string, { label: string; dot: string }> = {
  activo:    { label: 'Activo',    dot: 'bg-emerald-500' },
  pendiente: { label: 'Pendiente', dot: 'bg-amber-400'   },
  bloqueado: { label: 'Bloqueado', dot: 'bg-red-500'     },
  rechazado: { label: 'Rechazado', dot: 'bg-slate-400'   },
};

export default function AdminUsers() {
  const { users, companies, promoteToAdmin, demoteToUser, blockUser, unblockUser } = useApp();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [userToBlock, setUserToBlock] = useState<any | null>(null);

  // Approved companies only
  const approvedCompanies = companies.filter(c => c.estado === 'aprobado');

  const selectedCompany = approvedCompanies.find(c => c.id === selectedCompanyId) || null;

  const filteredUsers = users.filter(u => {
    if (u.rol === 'superadmin') return false;
    if (selectedCompanyId !== null && u.empresa_id !== selectedCompanyId) return false;
    const term = searchTerm.toLowerCase();
    return (
      u.nombre_completo.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term)
    );
  }).sort((a, b) => b.id - a.id);

  // Count active admins for a company (to prevent blocking the last one)
  const activeAdminsCount = (empresaId: number) =>
    users.filter(u => u.empresa_id === empresaId && u.rol === 'admin' && u.estado === 'activo').length;

  const handle = async (action: () => Promise<void>, id: number, successMsg: string) => {
    setLoadingId(id);
    try {
      await action();
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err?.message || 'Error al realizar la acción');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />
      <div className="flex">
        <Sidebar isAdmin />
        <main className="flex-1 p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold flex items-center gap-3">
                  <Users className="w-10 h-10 text-primary" /> Gestión de Usuarios
                </h1>
                <p className="text-muted-foreground mt-1">
                  Selecciona una empresa para gestionar sus usuarios
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Mostrando</div>
                <div className="text-3xl font-bold">{filteredUsers.length}</div>
              </div>
            </div>
          </motion.div>

          {/* Company selector + search */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Company filter */}
              <div className="relative min-w-[240px]">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  className="w-full pl-9 pr-9 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  value={selectedCompanyId ?? ''}
                  onChange={e => setSelectedCompanyId(e.target.value === '' ? null : Number(e.target.value))}
                >
                  <option value="">Todas las empresas</option>
                  {approvedCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </Card>

          {/* Company info banner when selected */}
          <AnimatePresence>
            {selectedCompany && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-6 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>{selectedCompany.nombre}</strong> · {filteredUsers.length} usuario(s) ·{' '}
                  Admins activos: <strong>{activeAdminsCount(selectedCompany.id)}</strong>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Users list */}
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map(user => {
                const rolCfg = ROL_CFG[user.rol] || ROL_CFG.empleado;
                const RolIcon = rolCfg.icon;
                const estadoCfg = ESTADO_CFG[user.estado || 'activo'] || ESTADO_CFG.activo;
                const isLoading = loadingId === user.id;
                const userCompany = companies.find(c => c.id === user.empresa_id);
                const isCompanyBlocked = userCompany?.estado === 'bloqueado';
                const isBlocked = user.estado === 'bloqueado' || isCompanyBlocked;
                const isActive = user.estado === 'activo' && !isCompanyBlocked;
                const isOnlyAdmin = user.rol === 'admin' && user.empresa_id
                  ? activeAdminsCount(user.empresa_id) <= 1
                  : false;

                return (
                  <motion.div key={user.id} layout
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <Card className={`p-5 flex items-center justify-between transition-colors ${isBlocked ? 'opacity-70 bg-red-50/30' : ''}`}>
                      {/* Left: user info */}
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold relative
                          ${isBlocked ? 'bg-red-100 text-red-400' : 'bg-gradient-to-br from-primary/20 to-secondary/20 text-primary'}`}>
                          {user.nombre_completo.charAt(0).toUpperCase()}
                          {isBlocked && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <Lock className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold">{user.nombre_completo}</h3>
                            {/* Rol badge */}
                            <span className={`${rolCfg.bg} ${rolCfg.text} px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1`}>
                              <RolIcon className="w-2.5 h-2.5" />
                              {rolCfg.label}
                            </span>
                            {/* Estado dot */}
                            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                              <span className={`w-2 h-2 rounded-full ${isCompanyBlocked ? 'bg-red-500' : estadoCfg.dot}`} />
                              {isCompanyBlocked ? 'Bloqueado (Empresa)' : estadoCfg.label}
                            </span>
                            {/* Only-admin warning */}
                            {isOnlyAdmin && !isBlocked && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Único admin
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.correo}</p>
                          {user.empresa && (
                            <p className="text-xs text-primary font-medium mt-0.5">
                              {user.empresa.nombre} · {user.cargo || 'Sin cargo'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: actions */}
                      {user.rol !== 'superadmin' && (
                        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                          {isLoading ? (
                            <span className="text-xs text-muted-foreground animate-pulse px-3">Procesando...</span>
                          ) : (
                            <>
                              {/* Block / Unblock */}
                              {isBlocked ? (
                                <Button variant="outline" size="sm"
                                  className="flex items-center gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 disabled:opacity-40"
                                  disabled={isCompanyBlocked}
                                  title={isCompanyBlocked ? 'No se puede desbloquear el usuario porque la empresa está bloqueada' : ''}
                                  onClick={() => handle(() => unblockUser(user.id), user.id, `${user.nombre_completo} desbloqueado`)}>
                                  <Unlock className="w-3.5 h-3.5" />
                                  Desbloquear
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm"
                                  className="flex items-center gap-1.5 text-red-500 border-red-300 hover:bg-red-50 disabled:opacity-40"
                                  disabled={isOnlyAdmin || !isActive || isCompanyBlocked}
                                  title={isCompanyBlocked ? 'La empresa de este usuario está bloqueada' : isOnlyAdmin ? 'Asigna otro admin antes de bloquear este' : !isActive ? 'El usuario debe estar activo para poder ser bloqueado' : ''}
                                  onClick={() => setUserToBlock(user)}>
                                  <Lock className="w-3.5 h-3.5" />
                                  Bloquear
                                </Button>
                              )}

                              {/* Promote / Demote */}
                              {!isBlocked && (
                                user.rol === 'admin' ? (
                                  <Button variant="outline" size="sm"
                                    className="flex items-center gap-1.5 text-slate-600 disabled:opacity-40"
                                    disabled={isOnlyAdmin || !isActive || isCompanyBlocked}
                                    title={isCompanyBlocked ? 'La empresa de este usuario está bloqueada' : isOnlyAdmin ? 'Asigna otro admin antes de degradar' : !isActive ? 'El usuario debe estar activo para cambiar su rol' : ''}
                                    onClick={() => handle(() => demoteToUser(user.id), user.id, `${user.nombre_completo} es ahora Empleado`)}>
                                    <UserMinus className="w-3.5 h-3.5" />
                                    Quitar Admin
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm"
                                    className="flex items-center gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-40"
                                    disabled={!isActive || isCompanyBlocked}
                                    title={isCompanyBlocked ? 'La empresa de este usuario está bloqueada' : !isActive ? 'El usuario debe estar activo para cambiar su rol' : ''}
                                    onClick={() => handle(() => promoteToAdmin(user.id), user.id, `${user.nombre_completo} es ahora Admin`)}>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    Hacer Admin
                                  </Button>
                                )
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredUsers.length === 0 && (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-1">No se encontraron usuarios</h3>
                <p className="text-muted-foreground text-sm">
                  {selectedCompanyId ? 'Esta empresa no tiene usuarios o no coincide la búsqueda.' : 'Selecciona una empresa para ver sus usuarios.'}
                </p>
              </Card>
            )}
          </div>

          {/* Premium Block User Modal */}
          <AnimatePresence>
            {userToBlock && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setUserToBlock(null)}
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
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
                    
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 shadow-inner">
                        <AlertTriangle className="w-8 h-8 animate-bounce-slow" />
                      </div>
                      
                      <h2 className="text-2xl font-black text-slate-800 mb-3">¿Bloquear a este usuario?</h2>
                      
                      <p className="text-sm text-slate-500 leading-relaxed mb-6">
                        ¿Estás seguro de bloquear a <strong className="text-slate-700">{userToBlock.nombre_completo}</strong>?
                        <br /><br />
                        <span className="text-left text-xs text-amber-600 bg-amber-50 px-3 py-2.5 rounded-lg border border-amber-200 mt-2 block font-semibold leading-normal">
                          ⚠️ Los proyectos creados por este usuario se suspenderán temporalmente hasta que se asigne un nuevo propietario. Además, su acceso a la plataforma quedará inhabilitado.
                        </span>
                      </p>

                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          className="flex-1 py-3 text-slate-500 hover:bg-slate-100 font-bold"
                          onClick={() => setUserToBlock(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="primary"
                          className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold shadow-lg shadow-red-500/20"
                          onClick={() => {
                            const u = userToBlock;
                            setUserToBlock(null);
                            handle(() => blockUser(u.id), u.id, `${u.nombre_completo} bloqueado`);
                          }}
                        >
                          Bloquear
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
