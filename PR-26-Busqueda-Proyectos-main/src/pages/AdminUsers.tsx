import { useState } from 'react';
import { useUsuarios, useModerarUsuario, type AccionUsuario } from '@/features/usuarios';
import { useEmpresas } from '@/features/empresas';
import { Navbar } from '@/shared/components/layout/Navbar';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Search, Shield, UserCheck, Lock, Unlock, UserMinus,
  Building2, ChevronDown, Crown, User as UserIcon, AlertTriangle,
} from 'lucide-react';

const ROL_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  superadmin: { label: 'Super Admin', bg: 'bg-muted', text: 'text-foreground', icon: Shield },
  admin:      { label: 'Admin',       bg: 'bg-info-subtle',   text: 'text-info-strong',   icon: Crown },
  empleado:   { label: 'Empleado',    bg: 'bg-muted',  text: 'text-muted-foreground',  icon: UserIcon },
};

const ESTADO_CFG: Record<string, { label: string; dot: string }> = {
  activo:    { label: 'Activo',    dot: 'bg-success' },
  pendiente: { label: 'Pendiente', dot: 'bg-warning'   },
  bloqueado: { label: 'Bloqueado', dot: 'bg-danger'     },
  rechazado: { label: 'Rechazado', dot: 'bg-muted-foreground'   },
};

export default function AdminUsers() {
  const { data: users = [] } = useUsuarios();
  const { data: companies = [] } = useEmpresas();
  const moderar = useModerarUsuario();
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

  // El toast (éxito y error) lo muestra useModerarUsuario.
  const handle = async (accion: AccionUsuario, id: number) => {
    setLoadingId(id);
    try { await moderar.mutateAsync({ id, accion }); }
    catch { /* noop */ }
    finally { setLoadingId(null); }
  };

  return (
    <div className="min-h-screen">
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
                className="mb-6 flex items-center gap-3 px-4 py-3 bg-info-subtle border border-info/30 rounded-xl text-sm text-info-strong">
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
                    <Card className={`p-5 flex items-center justify-between transition-colors ${isBlocked ? 'opacity-70 bg-danger-subtle/30' : ''}`}>
                      {/* Left: user info */}
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold relative
                          ${isBlocked ? 'bg-danger-subtle text-danger' : 'bg-gradient-to-br from-primary/20 to-secondary/20 text-primary'}`}>
                          {user.nombre_completo.charAt(0).toUpperCase()}
                          {isBlocked && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full flex items-center justify-center">
                              <Lock className="w-2.5 h-2.5 text-primary-foreground" />
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
                              <span className={`w-2 h-2 rounded-full ${isCompanyBlocked ? 'bg-danger' : estadoCfg.dot}`} />
                              {isCompanyBlocked ? 'Bloqueado (Empresa)' : estadoCfg.label}
                            </span>
                            {/* Only-admin warning */}
                            {isOnlyAdmin && !isBlocked && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-warning-strong bg-warning-subtle px-2 py-0.5 rounded-full border border-warning/30">
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
                                  className="flex items-center gap-1.5 text-success-strong border-success/40 hover:bg-success-subtle disabled:opacity-40"
                                  disabled={isCompanyBlocked}
                                  title={isCompanyBlocked ? 'No se puede desbloquear el usuario porque la empresa está bloqueada' : ''}
                                  onClick={() => handle('desbloquear', user.id)}>
                                  <Unlock className="w-3.5 h-3.5" />
                                  Desbloquear
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm"
                                  className="flex items-center gap-1.5 text-danger border-danger/40 hover:bg-danger-subtle disabled:opacity-40"
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
                                    className="flex items-center gap-1.5 text-muted-foreground disabled:opacity-40"
                                    disabled={isOnlyAdmin || !isActive || isCompanyBlocked}
                                    title={isCompanyBlocked ? 'La empresa de este usuario está bloqueada' : isOnlyAdmin ? 'Asigna otro admin antes de degradar' : !isActive ? 'El usuario debe estar activo para cambiar su rol' : ''}
                                    onClick={() => handle('degradar', user.id)}>
                                    <UserMinus className="w-3.5 h-3.5" />
                                    Quitar Admin
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm"
                                    className="flex items-center gap-1.5 text-info-strong border-info/40 hover:bg-info-subtle disabled:opacity-40"
                                    disabled={!isActive || isCompanyBlocked}
                                    title={isCompanyBlocked ? 'La empresa de este usuario está bloqueada' : !isActive ? 'El usuario debe estar activo para cambiar su rol' : ''}
                                    onClick={() => handle('promover', user.id)}>
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
                className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-modal p-4"
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
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-danger to-danger" />
                    
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-danger-subtle rounded-full flex items-center justify-center mx-auto mb-6 text-danger-strong shadow-inner">
                        <AlertTriangle className="w-8 h-8 animate-bounce-slow" />
                      </div>
                      
                      <h2 className="text-2xl font-black text-foreground mb-3">¿Bloquear a este usuario?</h2>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        ¿Estás seguro de bloquear a <strong className="text-foreground">{userToBlock.nombre_completo}</strong>?
                        <br /><br />
                        <span className="text-left text-xs text-warning-strong bg-warning-subtle px-3 py-2.5 rounded-lg border border-warning/30 mt-2 block font-semibold leading-normal">
                          ⚠️ Los proyectos creados por este usuario se suspenderán temporalmente hasta que se asigne un nuevo propietario. Además, su acceso a la plataforma quedará inhabilitado.
                        </span>
                      </p>

                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          className="flex-1 py-3 text-muted-foreground hover:bg-muted font-bold"
                          onClick={() => setUserToBlock(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="primary"
                          className="flex-1 py-3 bg-gradient-to-r from-destructive to-destructive hover:brightness-95 text-primary-foreground font-bold shadow-lg"
                          onClick={() => {
                            const u = userToBlock;
                            setUserToBlock(null);
                            handle('bloquear', u.id);
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
