import { motion } from 'motion/react';
import { Plus, ListTodo } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { AssigneeSelector } from './AssigneeSelector';
import { TaskColumn } from './TaskColumn';
import type { KanbanColumn, WorkspaceMember, WorkspaceTask } from './types';

export function TasksTab({
  puedeCrearTareas,
  isReadOnly,
  newTaskTitle,
  setNewTaskTitle,
  newTaskDesc,
  setNewTaskDesc,
  newTaskPriority,
  setNewTaskPriority,
  newTaskDeadline,
  setNewTaskDeadline,
  participatingUsers,
  newTaskAssignees,
  setNewTaskAssignees,
  handleCreateTask,
  loadingTasks,
  kanbanColumns,
  projectTasks,
  onMoveTask,
  onEditTask,
}: {
  puedeCrearTareas: boolean;
  isReadOnly: boolean;
  newTaskTitle: string;
  setNewTaskTitle: (v: string) => void;
  newTaskDesc: string;
  setNewTaskDesc: (v: string) => void;
  newTaskPriority: 'baja' | 'media' | 'alta';
  setNewTaskPriority: (v: 'baja' | 'media' | 'alta') => void;
  newTaskDeadline: string;
  setNewTaskDeadline: (v: string) => void;
  participatingUsers: WorkspaceMember[];
  newTaskAssignees: number[];
  setNewTaskAssignees: (ids: number[]) => void;
  handleCreateTask: () => void;
  loadingTasks: boolean;
  kanbanColumns: KanbanColumn[];
  projectTasks: WorkspaceTask[];
  onMoveTask: (taskId: number, newColId: number) => void;
  onEditTask: (task: WorkspaceTask) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

      {/* Create Task (Owner or granted 'miembro' only) */}
      {puedeCrearTareas && !isReadOnly && (
        <Card className="p-6 mb-6 border-none shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Nueva Tarea
          </h3>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <Input
              placeholder="Título de la tarea *"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
            />
            <Input
              placeholder="Descripción (opcional)"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
            />
          </div>
          {/* Row 2: priority + date */}
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as 'baja' | 'media' | 'alta')}
              className="px-3 py-2 bg-input-background border border-input rounded-lg text-sm"
            >
              <option value="baja">🟢 Prioridad Baja</option>
              <option value="media">🟡 Prioridad Media</option>
              <option value="alta">🔴 Prioridad Alta</option>
            </select>
            <Input
              type="date"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="w-44"
            />
          </div>
          {/* Row 3: assignee selector + create button */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <AssigneeSelector
                participants={participatingUsers}
                selected={newTaskAssignees}
                onChange={setNewTaskAssignees}
                compact
              />
            </div>
            <Button
              variant="primary"
              onClick={handleCreateTask}
              className="flex items-center gap-2 flex-shrink-0 self-end"
            >
              <Plus className="w-4 h-4" /> Crear Tarea
            </Button>
          </div>
        </Card>
      )}

      {/* Loading */}
      {loadingTasks ? (
        <Card className="p-16 text-center border-none shadow-sm">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Cargando tablero...</p>
        </Card>
      ) : kanbanColumns.length === 0 && !puedeCrearTareas ? (
        <Card className="p-16 text-center border-none shadow-sm">
          <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold text-muted-foreground">No hay tareas aún</p>
          <p className="text-sm text-muted-foreground/70">El propietario del proyecto o un miembro con acceso puede crear tareas desde este tablero</p>
        </Card>
      ) : (
        /* Kanban Board — Dynamic columns from DB */
        <div className="flex gap-4 overflow-x-auto pb-6">
          {kanbanColumns.map(col => (
            <TaskColumn
              key={col.id}
              title={col.nombre}
              columna_id={col.id}
              tasks={projectTasks.filter(t => t.columna_id === col.id)}
              onDrop={onMoveTask}
              onEditTask={onEditTask}
            />
          ))}
          {/* If no columns yet and can create tasks, show placeholder */}
          {kanbanColumns.length === 0 && puedeCrearTareas && (
            <div className="flex-1 text-center py-16 text-muted-foreground">
              <ListTodo className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm">Crea tu primera tarea y se inicializará el tablero automáticamente</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
