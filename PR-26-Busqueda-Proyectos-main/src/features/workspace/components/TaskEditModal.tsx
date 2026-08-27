import { MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input, TextArea } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { AssigneeSelector } from './AssigneeSelector';
import type { User } from '@/features/usuarios';
import type { WorkspaceMember, WorkspaceTask } from './types';

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
  task: WorkspaceTask;
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
    <Modal
      open
      onClose={onClose}
      titulo="Detalles de la tarea"
      size="lg"
      acciones={
        !suspended ? (
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Eliminar
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" onClick={onSave}>Guardar cambios</Button>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <Input
          label="Título"
          value={editTaskTitle}
          onChange={(e) => setEditTaskTitle(e.target.value)}
          placeholder="Nombre de la tarea"
        />

        <TextArea
          label="Descripción"
          value={editTaskDesc}
          onChange={(e) => setEditTaskDesc(e.target.value)}
          placeholder="Añade detalles sobre lo que hay que hacer..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-prioridad" className="mb-2 block text-sm font-medium text-foreground">
              Prioridad
            </label>
            <select
              id="task-prioridad"
              value={editTaskPriority}
              onChange={(e) => setEditTaskPriority(e.target.value as 'baja' | 'media' | 'alta')}
              className="w-full min-h-11 rounded-md border border-input bg-input-background px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <Input
            label="Fecha límite"
            type="date"
            value={editTaskDeadline}
            onChange={(e) => setEditTaskDeadline(e.target.value)}
            disabled={suspended}
          />
        </div>

        <AssigneeSelector
          participants={participatingUsers}
          selected={editTaskAssignees}
          onChange={setEditTaskAssignees}
        />

        {/* Comentarios */}
        <div className="border-t border-border pt-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Comentarios y actividad
          </h3>

          <div className="mb-4 max-h-60 space-y-4 overflow-y-auto pr-2">
            {task.comentarios && task.comentarios.length > 0 ? (
              task.comentarios.map((comment) => {
                const commenter = users.find((u) => u.id === comment.usuario_id);
                return (
                  <div
                    key={comment.id}
                    className="flex gap-3 rounded-lg border border-border/50 bg-muted/30 p-3"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {commenter?.nombre_completo?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
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
              <p className="py-6 text-center text-sm italic text-muted-foreground">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Añadir un comentario..."
              value={newTaskComment}
              onChange={(e) => setNewTaskComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
              className="flex-1"
              disabled={suspended}
            />
            <Button
              variant="primary"
              onClick={onAddComment}
              disabled={!newTaskComment.trim() || suspended}
            >
              Comentar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
