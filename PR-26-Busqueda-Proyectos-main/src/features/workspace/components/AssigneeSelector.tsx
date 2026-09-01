import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Plus, Users, X } from 'lucide-react';

/* Paleta categórica para distinguir responsables (Anexo A1: categorías por
 * color permitidas). Usa los tokens de la paleta de gráficas. */
const AVATAR_COLORS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
  'bg-primary',
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
  // Combo box propio (no <select> nativo): el desplegable nativo no se puede
  // estilar y en modo oscuro se ve mal. Mismo patrón que el filtro de
  // categorías de Explorar: trigger + panel con tokens de tema.
  const [abierto, setAbierto] = useState(false);

  const unselected = participants.filter(u => !selected.includes(u.id));
  const selectedUsers = participants.filter(u => selected.includes(u.id));

  const getColor = (userId: number) => {
    const idx = participants.findIndex(p => p.id === userId);
    return AVATAR_COLORS[Math.abs(idx) % AVATAR_COLORS.length];
  };

  const agregar = (id: number) => {
    onChange([...selected, id]);
    setAbierto(false);
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
              <div className={`w-5 h-5 rounded-full ${getColor(u.id)} flex items-center justify-center text-primary-foreground text-[9px] font-black flex-shrink-0`}>
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
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={abierto}
            onClick={() => setAbierto(o => !o)}
            className="w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2 bg-input-background border border-input rounded-xl text-sm text-muted-foreground cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Agregar persona…
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} />
          </button>

          {/* Overlay invisible para cerrar al hacer clic afuera */}
          {abierto && (
            <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          )}

          <AnimatePresence>
            {abierto && (
              <motion.div
                role="listbox"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="absolute top-full left-0 right-0 mt-2 z-50 max-h-52 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl"
              >
                {unselected.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => agregar(u.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-foreground text-left transition-colors hover:bg-muted/60 hover:text-primary"
                  >
                    <span className={`w-6 h-6 rounded-full ${getColor(u.id)} flex items-center justify-center text-primary-foreground text-[10px] font-black flex-shrink-0`}>
                      {u.nombre_completo.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{compact ? u.nombre_completo.split(' ')[0] : u.nombre_completo}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : participants.length > 0 ? (
        <p className="text-xs text-muted-foreground/60 italic">Todos los miembros ya están asignados</p>
      ) : (
        <p className="text-xs text-muted-foreground/60 italic">Sin participantes en el proyecto</p>
      )}
    </div>
  );
}
