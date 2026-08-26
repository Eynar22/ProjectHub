import { motion } from 'motion/react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import type { Company, Project } from '../../context/AppContext';
import type { WorkspaceMember } from './types';

export function TeamTab({
  participatingUsers,
  companies,
  project,
  isOwner,
  updatingAccesoId,
  onToggleAcceso,
}: {
  participatingUsers: WorkspaceMember[];
  companies: Company[];
  project: Project;
  isOwner: boolean;
  updatingAccesoId: number | null;
  onToggleAcceso: (usuarioId: number, rolActual: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Usuarios Participantes</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {participatingUsers.map(user => {
            const userComp = companies.find(c => c.id === user.empresa_id);
            const esCreador = user.id === project.creador_id;
            const rolEnProyecto = project.participantes?.find(p => p.usuario_id === user.id)?.rol;
            const tieneAccesoTareas = rolEnProyecto === 'miembro';
            return (
              <Card key={user.id} className="p-4 bg-muted">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${esCreador ? 'bg-gradient-to-br from-primary to-purple-500' : 'bg-gradient-to-br from-accent to-success'
                    }`}>
                    {user.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{user.nombre_completo}</h4>
                    {user.cargo && <p className="text-sm text-muted-foreground">{user.cargo}</p>}
                    {userComp && <p className="text-sm text-muted-foreground">{userComp.nombre}</p>}
                    {esCreador ? (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">Creador</span>
                    ) : tieneAccesoTareas && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded mt-1 inline-block">Puede crear tareas</span>
                    )}
                  </div>
                  {isOwner && !esCreador && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updatingAccesoId === user.id}
                      onClick={() => onToggleAcceso(user.id, rolEnProyecto || 'colaborador')}
                    >
                      {updatingAccesoId === user.id
                        ? '...'
                        : tieneAccesoTareas ? 'Quitar acceso' : 'Dar acceso a tareas'}
                    </Button>
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
