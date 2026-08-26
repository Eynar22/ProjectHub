import { motion } from 'motion/react';
import { X, MessageSquare, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';
import { AssigneeSelector } from './AssigneeSelector';
import type { User } from '../../context/AppContext';
import type { WorkspaceMember } from './types';

export function TaskEditModal({
  task,
  onClose,
  editTaskTitle,
  setEditTaskTitle,
  editTaskDesc,
  setEditTaskDesc,
  editTaskPriority,
  setEditTaskPriority,
  editTaskDeadline,
  setEditTaskDeadline,
  suspended,
  participatingUsers,
  editTaskAssignees,
  setEditTaskAssignees,
  users,
  newTaskComment,
  setNewTaskComment,
  onAddComment,
  onDelete,
  onSave,
}: {
  task: any;
  onClose: () => void;
  editTaskTitle: string;
  setEditTaskTitle: (v: string) => void;
  editTaskDesc: string;
  setEditTaskDesc: (v: string) => void;
  editTaskPriority: 'baja' | 'media' | 'alta';
  setEditTaskPriority: (v: 'baja' | 'media' | 'alta') => void;
  editTaskDeadline: string;
  setEditTaskDeadline: (v: string) => void;
  suspended: boolean;
  participatingUsers: WorkspaceMember[];
  editTaskAssignees: number[];
  setEditTaskAssignees: (ids: number[]) => void;
  users: User[];
  newTaskComment: string;
  setNewTaskComment: (v: string) => void;
  onAddComment: () => void;
  onDelete: (taskId: number) => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-2xl font-bold mb-6">Detalles de la Tarea</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Título</label>
              <Input
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                placeholder="Nombre de la tarea"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Descripción</label>
              <TextArea
                value={editTaskDesc}
                onChange={(e) => setEditTaskDesc(e.target.value)}
                placeholder="Añade detalles sobre lo que hay que hacer..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Prioridad</label>
                <select
                  value={editTaskPriority}
                  onChange={(e) => setEditTaskPriority(e.target.value as any)}
                  className="w-full px-4 py-2 bg-input-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Fecha Límite</label>
                <Input
                  type="date"
                  value={editTaskDeadline}
                  onChange={(e) => setEditTaskDeadline(e.target.value)}
                  disabled={suspended}
                />
              </div>
            </div>

            <div className="mt-4">
              <AssigneeSelector
                participants={participatingUsers}
                selected={editTaskAssignees}
                onChange={setEditTaskAssignees}
              />
            </div>
          </div>

          {/* Task Comments Section */}
          <div className="mt-8 border-t pt-6">
            <h4 className="text-sm font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comentarios y Actividad
            </h4>

            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
              {task.comentarios && task.comentarios.length > 0 ? (
                task.comentarios.map((comment: any) => {
                  const commenter = users.find(u => u.id === comment.usuario_id);
                  return (
                    <div key={comment.id} className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {commenter?.nombre_completo?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{commenter?.nombre_completo}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(comment.fecha_creacion).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-balance">{comment.texto}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm italic">
                  No hay comentarios aún. ¡Sé el primero en comentar!
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Añadir un comentario..."
                value={newTaskComment}
                onChange={(e) => setNewTaskComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onAddComment()}
                className="flex-1 h-9 text-sm"
                disabled={suspended}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={onAddComment}
                disabled={!newTaskComment.trim() || suspended}
              >
                Comentar
              </Button>
            </div>
          </div>

          {!suspended && (
            <div className="flex justify-between items-center mt-8 pt-4 border-t">
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button variant="primary" onClick={onSave}>Guardar Cambios</Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
