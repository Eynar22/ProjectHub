import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/* Modal accesible (Manual 8.6):
 * - cierra con X, ESC y clic en el fondo
 * - atrapa el foco (Tab no sale); al abrir foca el diálogo; al cerrar devuelve
 *   el foco al elemento que lo abrió
 * - role="dialog" aria-modal + aria-labelledby al título
 * - bloquea el scroll del fondo
 * - ancho máx 480–640px; en móvil ocupa el ancho con márgenes */
export function Modal({
  open,
  onClose,
  titulo,
  children,
  /** pie con acciones: primaria a la derecha, cancelar a la izquierda. */
  acciones,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  titulo: string;
  children: ReactNode;
  acciones?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const tituloId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<HTMLElement | null>(null);
  // El padre casi siempre pasa `onClose` como arrow function inline (nueva
  // identidad en cada render suyo). Si el efecto dependiera de `onClose`
  // directo, se re-ejecutaría en cada tecleo del contenido del modal y
  // volvería a robar el foco hacia el primer elemento interactivo. Con el
  // ref, el efecto corre solo una vez por apertura pero el handler de ESC
  // sigue llamando siempre a la versión más reciente de `onClose`.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    disparadorRef.current = document.activeElement as HTMLElement | null;
    const scrollBloqueado = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    // Foco inicial: primer elemento interactivo o el propio panel.
    const primero = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (primero ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const foco = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (foco.length === 0) {
        e.preventDefault();
        return;
      }
      const primeroEl = foco[0];
      const ultimoEl = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === primeroEl) {
        e.preventDefault();
        ultimoEl.focus();
      } else if (!e.shiftKey && document.activeElement === ultimoEl) {
        e.preventDefault();
        primeroEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = scrollBloqueado;
      disparadorRef.current?.focus?.();
    };
  }, [open]);

  const anchoMax = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full ${anchoMax} overflow-hidden rounded-xl border border-border bg-card shadow-xl outline-none`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
              <h2 id={tituloId} className="text-lg font-semibold">
                {titulo}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="-mr-2 -my-1.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
            {acciones && (
              <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                {acciones}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
