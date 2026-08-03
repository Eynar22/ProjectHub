import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { toast } from 'sonner';
import {
  Users, ArrowLeft, Search, UserCheck, UserMinus, Lock, Unlock,
  Building2, Crown, AlertTriangle, User as UserIcon
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminCompanyUsers() {
  const { id } = useParams();
  const { companies, users, promoteToAdmin, demoteToUser, blockUser, unblockUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const company = companies.find(c => c.id === Number(id));
  const companyUsers = users.filter(u => u.empresa_id === Number(id));

  const filteredUsers = companyUsers.filter(user => 
    user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count active admins for this company to prevent blocking the last one
  const activeAdminsCount = () =>
    companyUsers.filter(u => u.rol === 'admin' && u.estado === 'activo').length;

  const handleAction = async (action: () => Promise<void>, userId: number, successMsg: string) => {
    setLoadingId(userId);
    try {
      await action();
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err?.message || 'Error al realizar la acción');
    } finally {
      setLoadingId(null);
    }
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Empresa no encontrada</h1>
          <Link to="/admin/companies">
            <Button variant="primary">Volver a Empresas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />
      
      <div className="flex">
        <Sidebar isAdmin />
        
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <Link to="/admin/companies">
              <Button variant="ghost" className="mb-6 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver a Empresas
              </Button>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-8"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold">{company.nombre}</h1>
                </div>
                <p className="text-muted-foreground">
                  Gestión de usuarios y permisos administrativos
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Miembros</div>
                <div className="text-3xl font-bold">{companyUsers.length}</div>
              </div>
            </motion.div>

            {/* Company info banner showing admins count */}
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span>
                Admins activos en esta empresa: <strong>{activeAdminsCount()}</strong>
              </span>
            </div>

            <Card className="p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            <div className="grid gap-4">
              {filteredUsers.map((member, index) => {
                const isBlocked = member.estado === 'bloqueado';
                const isOnlyAdmin = member.rol === 'admin' 
                  ? activeAdminsCount() <= 1 
                  : false;
                const isLoading = loadingId === member.id;

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`p-5 flex items-center justify-between hover:border-primary/50 transition-colors ${
                      isBlocked ? 'opacity-70 bg-red-50/30' : ''
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold relative ${
                          isBlocked ? 'bg-red-100 text-red-400' : 'bg-gradient-to-br from-primary/20 to-secondary/20 text-primary'
                        }`}>
                          {member.nombre_completo.charAt(0).toUpperCase()}
                          {isBlocked && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <Lock className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg">{member.nombre_completo}</h3>
                            
                            {/* Role Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${
                              member.rol === 'admin' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-slate-100 text-slate-600 border border-border'
                            }`}>
                              {member.rol === 'admin' ? (
                                <>
                                  <Crown className="w-2.5 h-2.5" />
                                  Administrador
                                </>
                              ) : (
                                <>
                                  <UserIcon className="w-2.5 h-2.5" />
                                  Colaborador
                                </>
                              )}
                            </span>

                            {/* Only-admin warning */}
                            {isOnlyAdmin && !isBlocked && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Único admin activo
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{member.correo}</p>
                          {member.cargo && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {member.cargo}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                        {isLoading ? (
                          <span className="text-xs text-muted-foreground animate-pulse px-3">Procesando...</span>
                        ) : (
                          <>
                            {/* Block / Unblock Button */}
                            {isBlocked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                onClick={() => handleAction(() => unblockUser(member.id), member.id, `${member.nombre_completo} desbloqueado`)}
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                Desbloquear
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1.5 text-red-500 border-red-300 hover:bg-red-50 disabled:opacity-40"
                                disabled={isOnlyAdmin}
                                title={isOnlyAdmin ? 'Asigna otro admin antes de bloquear este' : ''}
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de bloquear a ${member.nombre_completo}? Los proyectos en los que es el creador se suspenderán hasta que se asigne un nuevo propietario.`)) {
                                    handleAction(() => blockUser(member.id), member.id, `${member.nombre_completo} bloqueado`);
                                  }
                                }}
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Bloquear
                              </Button>
                            )}

                            {/* Promote / Demote Button */}
                            {!isBlocked && (
                              member.rol === 'admin' ? (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1.5 text-slate-600 disabled:opacity-40"
                                  disabled={isOnlyAdmin}
                                  title={isOnlyAdmin ? 'Asigna otro admin antes de degradar' : ''}
                                  onClick={() => handleAction(() => demoteToUser(member.id), member.id, `${member.nombre_completo} es ahora Empleado`)}
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  Quitar Admin
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50"
                                  onClick={() => handleAction(() => promoteToAdmin(member.id), member.id, `${member.nombre_completo} es ahora Admin`)}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Hacer Admin
                                </Button>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}

              {filteredUsers.length === 0 && (
                <Card className="p-12 text-center text-muted-foreground italic">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
