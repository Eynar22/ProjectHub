import { ChevronDown, Users, X } from 'lucide-react';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-blue-500',
  'from-lime-400 to-green-500',
];

export function AssigneeSelector({
  participants,
  selected,
  onChange,
  compact = false,
}: {
  participants: { id: number; nombre_completo: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
  compact?: boolean;
}) {
  const unselected = participants.filter(u => !selected.includes(u.id));
  const selectedUsers = participants.filter(u => selected.includes(u.id));

  const getColor = (userId: number) => {
    const idx = participants.findIndex(p => p.id === userId);
    return AVATAR_COLORS[Math.abs(idx) % AVATAR_COLORS.length];
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-2">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Asignar a</span>
        {selectedUsers.length > 0 && (
          <span className="ml-auto text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">
            {selectedUsers.length} seleccionado{selectedUsers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Selected pills — each has an X to remove */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedUsers.map(u => (
            <div
              key={u.id}
              className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 border border-primary/30 text-primary"
            >
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getColor(u.id)} flex items-center justify-center text-white text-[9px] font-black flex-shrink-0`}>
                {u.nombre_completo.charAt(0).toUpperCase()}
              </div>
              <span>{compact ? u.nombre_completo.split(' ')[0] : u.nombre_completo}</span>
              <button
                type="button"
                onClick={() => onChange(selected.filter(id => id !== u.id))}
                className="ml-0.5 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10 p-0.5"
                title={`Quitar ${u.nombre_completo}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Combobox — only shows unassigned members */}
      {unselected.length > 0 ? (
        <div className="relative">
          <select
            value=""
            onChange={e => {
              if (e.target.value) {
                onChange([...selected, Number(e.target.value)]);
                e.target.value = '';
              }
            }}
            className="w-full appearance-none pl-3 pr-8 py-2 bg-muted/50 border border-input rounded-xl text-sm text-muted-foreground cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="">＋ Agregar persona...</option>
            {unselected.map(u => (
              <option key={u.id} value={u.id}>{u.nombre_completo}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      ) : participants.length > 0 ? (
        <p className="text-xs text-muted-foreground/60 italic">Todos los miembros ya están asignados</p>
      ) : (
        <p className="text-xs text-muted-foreground/60 italic">Sin participantes en el proyecto</p>
      )}
    </div>
  );
}
