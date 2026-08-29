import { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Avatar } from '@/shared/components/ui/Avatar';
import type { Company } from '@/features/empresas';
import type { Project } from '@/features/proyectos';
import type { WorkspaceMember } from './types';
import { esIndependiente } from '@/shared/utils/roles';

export function TeamTab({
  participatingUsers,
  companies,
  project,
  isOwner,
  updatingAccesoId,
  onToggleAcceso,
  expulsandoId,
  onExpulsar,
}: {
  participatingUsers: WorkspaceMember[];
  companies: Company[];
  project: Project;
  isOwner: boolean;
  updatingAccesoId: number | null;
  onToggleAcceso: (usuarioId: number, rolActual: string) => void;
  expulsandoId: number | null;
  onExpulsar: (usuarioId: number) => void;
}) {
  // Confirmación en línea antes de expulsar (evita expulsiones accidentales).
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6">
        <h3 className="text-xl font-bold tracking-tight mb-6">Usuarios Participantes</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {participatingUsers.map(user => {
            const userComp = companies.find(c => c.id === user.empresa_id);
            const esCreador = user.id === project.creador_id;
            const rolEnProyecto = project.participantes?.find(p => p.usuario_id === user.id)?.rol;
            const tieneAccesoTareas = rolEnProyecto === 'miembro';
            const expulsando = expulsandoId === user.id;
            return (
              <Card key={user.id} className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={user.nombre_completo}
                    src={user.foto_url}
                    className="w-14 h-14 rounded-full text-xl"
                    fallbackClassName={`font-bold ${esCreador ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{user.nombre_completo}</h4>
                    {user.cargo && <p className="text-sm text-muted-foreground truncate">{user.cargo}</p>}
                    {userComp
                      ? <p className="text-sm text-muted-foreground truncate">{userComp.nombre}</p>
                      : esIndependiente(user) && <p className="text-sm text-muted-foreground truncate">Independiente</p>}
                    <div className="mt-1.5">
                      {esCreador ? (
                        <Badge variant="info" size="sm">Creador</Badge>
                      ) : tieneAccesoTareas && (
                        <Badge variant="success" size="sm">Puede crear tareas</Badge>
                      )}
                    </div>
                  </div>
                  {isOwner && !esCreador && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingAccesoId === user.id || expulsando}
                        onClick={() => onToggleAcceso(user.id, rolEnProyecto || 'colaborador')}
                      >
                        {updatingAccesoId === user.id
                          ? '...'
                          : tieneAccesoTareas ? 'Quitar acceso' : 'Dar acceso a tareas'}
                      </Button>

                      {confirmandoId === user.id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={expulsando}
                            onClick={() => { onExpulsar(user.id); setConfirmandoId(null); }}
                          >
                            {expulsando ? '...' : 'Confirmar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={expulsando}
                            onClick={() => setConfirmandoId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger-strong"
                          disabled={expulsando}
                          onClick={() => setConfirmandoId(user.id)}
                        >
                          Expulsar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
