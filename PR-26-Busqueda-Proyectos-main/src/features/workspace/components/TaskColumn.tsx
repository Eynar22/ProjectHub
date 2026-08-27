import { useDrop } from 'react-dnd';
import { TaskCard } from './TaskCard';
import type { WorkspaceTask } from './types';

export function TaskColumn({
  title,
  columna_id,
  tasks,
  onDrop,
  onEditTask
}: {
  title: string;
  columna_id: number;
  tasks: WorkspaceTask[];
  onDrop: (taskId: number, newColId: number) => void;
  onEditTask: (task: WorkspaceTask) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: number; columna_id: number }) => {
      if (item.columna_id !== columna_id) {
        onDrop(item.id, columna_id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const colColors: Record<string, string> = {
    'Por Hacer': 'border-t-slate-400',
    'En Proceso': 'border-t-warning',
    'Completado': 'border-t-success',
  };
  const topColor = colColors[title] || 'border-t-primary';

  return (
    <div ref={drop} className={`flex-1 min-w-[300px] max-w-[360px]`}>
      <div className={`bg-muted/30 rounded-2xl border border-border/50 border-t-4 ${topColor} ${isOver ? 'ring-2 ring-primary ring-inset' : ''} min-h-[500px] transition-all`}>
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight text-foreground">{title}</h3>
            <span className="bg-background text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">
              {tasks.length}
            </span>
          </div>
        </div>
        <div className="px-3 pb-3 space-y-2">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onMove={onDrop} onClick={onEditTask} />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/40">
              <p className="text-xs">Arrastra aquí</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
