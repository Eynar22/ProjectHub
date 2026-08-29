import { useState } from 'react';
import type { ComponentType } from 'react';
import { useUsuarios, useModerarUsuario, type AccionUsuario, type User } from '@/features/usuarios';
import { useEmpresas } from '@/features/empresas';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { EstadoVacio, EstadoError } from '@/shared/components/feedback';
import { Modal } from '@/shared/components/ui/Modal';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Avatar } from '@/shared/components/ui/Avatar';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Search, Shield, UserCheck, Lock, Unlock, UserMinus,
  Building2, ChevronDown, Crown, User as UserIcon, AlertTriangle,
} from 'lucide-react';

const ROL_CFG: Record<string, { label: string; bg: string; text: string; icon: ComponentType<{ className?: string }> }> = {
  superadmin: { label: 'Super Admin', bg: 'bg-muted', text: 'text-foreground', icon: Shield },
  admin:      { label: 'Admin',       bg: 'bg-info-subtle',   text: 'text-info-strong',   icon: Crown },
  empleado:   { label: 'Empleado',    bg: 'bg-muted',  text: 'text-muted-foreground',  icon: UserIcon },
  colaborador:{ label: 'Colaborador', bg: 'bg-muted',  text: 'text-muted-foreground',  icon: UserIcon },
};

const ESTADO_CFG: Record<string, { label: string; dot: string }> = {
  activo:    { label: 'Activo',    dot: 'bg-success' },
  pendiente: { label: 'Pendiente', dot: 'bg-warning'   },
  bloqueado: { label: 'Bloqueado', dot: 'bg-danger'     },
  rechazado: { label: 'Rechazado', dot: 'bg-muted-foreground'   },
};

export default function AdminUsers() {
  const { data: users = [], isError, refetch } = useUsuarios();
  const { data: companies = [] } = useEmpresas();
  const moderar = useModerarUsuario();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);

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
    <AppLayout isAdmin contained mainClassName="flex-1 p-8">
      <Breadcrumbs items={[{ label: "Panel", to: "/admin" }, { label: "Usuarios" }]} />
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" /> Gestión de Usuarios
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
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
                  aria-label="Filtrar por empresa" className="w-full pl-9 pr-9 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
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
                  aria-label="Buscar usuarios" placeholder="Buscar por nombre o correo..."
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
                        <div className="relative flex-shrink-0">
                          <Avatar
                            name={user.nombre_completo}
                            src={user.foto_url}
                            className="w-12 h-12 rounded-full text-lg"
                            fallbackClassName={`font-bold ${isBlocked ? 'bg-danger-subtle text-danger' : 'bg-primary/15 text-primary'}`}
                          />
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

            {isError ? (
              <EstadoError
                titulo="No pudimos cargar los usuarios"
                onReintentar={() => refetch()}
              />
            ) : filteredUsers.length === 0 && (
              <EstadoVacio
                icono={Users}
                titulo="No se encontraron usuarios"
                descripcion={selectedCompanyId ? "Esta empresa no tiene usuarios o no coincide la búsqueda." : "Selecciona una empresa para ver sus usuarios."}
              />
            )}
          </div>

          {/* Confirmación de bloqueo */}
          <Modal
            open={!!userToBlock}
            onClose={() => setUserToBlock(null)}
            titulo="¿Bloquear a este usuario?"
            size="sm"
            acciones={
              <>
                <Button variant="ghost" onClick={() => setUserToBlock(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const u = userToBlock;
                    setUserToBlock(null);
                    if (u) handle('bloquear', u.id);
                  }}
                >
                  Bloquear
                </Button>
              </>
            }
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-subtle text-danger-strong">
                <AlertTriangle className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground">
                ¿Estás seguro de bloquear a{' '}
                <strong className="text-foreground">{userToBlock?.nombre_completo}</strong>?
              </p>
              <p className="rounded-lg border border-warning/30 bg-warning-subtle px-3 py-2.5 text-xs font-semibold leading-normal text-warning-strong">
                ⚠️ Los proyectos creados por este usuario se suspenderán temporalmente hasta que se
                asigne un nuevo propietario. Su acceso a la plataforma quedará inhabilitado.
              </p>
            </div>
          </Modal>
    </AppLayout>
  );
}
