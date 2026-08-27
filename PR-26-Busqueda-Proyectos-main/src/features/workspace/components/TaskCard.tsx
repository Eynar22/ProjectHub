import { Calendar } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { Card } from '@/shared/components/ui/Card';

export function TaskCard({
  task,
  onMove,
  onClick
}: {
  task: any;
  onMove: (taskId: number, newColId: number) => void;
  onClick: (task: any) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, columna_id: task.columna_id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  })) as any;

  const priorityConfig = {
    alta: { label: 'Alta', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
    media: { label: 'Media', cls: 'bg-warning/10 text-warning border-warning/20' },
    baja: { label: 'Baja', cls: 'bg-success/10 text-success border-success/20' },
  };
  const prio = priorityConfig[task.prioridad as 'alta' | 'media' | 'baja'] || priorityConfig.baja;

  // Multi-assignees: API returns task.usuarios[]
  const assignees: { id: number; nombre_completo: string }[] = task.usuarios ?? [];
  // Paleta categórica para distinguir responsables (Anexo A1).
  const AVATAR_COLORS = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.4 : 1 }} className="cursor-grab active:cursor-grabbing">
      <Card
        className="p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all mb-3 border-none shadow-sm"
        onClick={() => onClick(task)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-sm leading-tight flex-1 mr-2">{task.titulo}</h4>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold flex-shrink-0 ${prio.cls}`}>
            {prio.label}
          </span>
        </div>

        {task.descripcion && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.descripcion}</p>
        )}

        {/* Multi-assignee avatar stack */}
        {assignees.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex -space-x-2">
              {assignees.slice(0, 3).map((u, i) => (
                <div
                  key={u.id}
                  title={u.nombre_completo}
                  className={`w-6 h-6 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-primary-foreground text-[9px] font-black ring-2 ring-background`}
                >
                  {u.nombre_completo.charAt(0).toUpperCase()}
                </div>
              ))}
              {assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground ring-2 ring-background">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {assignees.length === 1
                ? assignees[0].nombre_completo
                : `${assignees.length} asignados`}
            </span>
          </div>
        )}

        {task.fecha_limite && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(task.fecha_limite).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
          </div>
        )}
      </Card>
    </div>
  );
}
