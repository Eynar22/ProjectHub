/* ============================================================================
 * src/shared/components/ui/Galeria.tsx
 * Galería de fotos en mosaico (la primera grande) con visor a pantalla
 * completa: flechas, teclado (← → Esc), deslizar en móvil, contador y
 * miniaturas.
 *
 *   <Galeria fotos={['/api/archivos/...', ...]} nombre="Mi empresa" />
 * ========================================================================= */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';

/** Cuántas fotos entran en el mosaico; el resto se ve en el visor. */
const EN_MOSAICO = 5;

export function Galeria({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  if (fotos.length === 0) return null;

  const visibles = fotos.slice(0, EN_MOSAICO);
  const restantes = fotos.length - visibles.length;
  const n = visibles.length;

  // Tamaño de cada celda según cuántas fotos hay, para que el mosaico quede lleno.
  const celda = (i: number) => {
    if (n === 1) return 'col-span-4 row-span-2';
    if (i === 0) return 'col-span-4 sm:col-span-2 row-span-2';
    if (n === 2) return 'col-span-4 sm:col-span-2 row-span-2';
    if (n === 3) return 'col-span-2 row-span-1';
    if (n === 4) return i === 3 ? 'col-span-4 sm:col-span-2' : 'col-span-2 sm:col-span-1';
    return 'col-span-2 sm:col-span-1';
  };

  return (
    <>
      <div className="grid grid-cols-4 auto-rows-[110px] sm:auto-rows-[140px] gap-2 sm:gap-3">
        {visibles.map((url, i) => {
          const esUltima = i === visibles.length - 1 && restantes > 0;
          return (
            <button
              key={url + i}
              type="button"
              onClick={() => setAbierta(i)}
              aria-label={esUltima ? `Ver las ${fotos.length} fotos` : `Ampliar foto ${i + 1} de ${fotos.length}`}
              className={`group relative overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring ${celda(i)}`}
            >
              <img src={url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
              {esUltima ? (
                <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-xl font-bold">
                  +{restantes}
                </span>
              ) : (
                <Expand className="absolute bottom-2 right-2 w-5 h-5 text-white drop-shadow opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'} · Haz clic en una para verla en grande
      </p>

      <AnimatePresence>
        {abierta !== null && (
          <Visor fotos={fotos} nombre={nombre} inicial={abierta} onCerrar={() => setAbierta(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function Visor({ fotos, nombre, inicial, onCerrar }: {
  fotos: string[]; nombre: string; inicial: number; onCerrar: () => void;
}) {
  const [actual, setActual] = useState(inicial);
  const [direccion, setDireccion] = useState(0);
  const toqueX = useRef<number | null>(null);
  const miniaturas = useRef<HTMLDivElement>(null);
  const total = fotos.length;

  const ir = useCallback((paso: number) => {
    setDireccion(paso);
    setActual((a) => (a + paso + total) % total);
  }, [total]);

  // Teclado y bloqueo del scroll de la página mientras el visor está abierto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
      else if (e.key === 'ArrowRight') ir(1);
      else if (e.key === 'ArrowLeft') ir(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [ir, onCerrar]);

  // La miniatura activa siempre a la vista.
  useEffect(() => {
    miniaturas.current?.children[actual]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [actual]);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${nombre}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col text-white select-none"
      onClick={onCerrar}
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold truncate">
          {nombre} <span className="text-white/60 font-normal ml-2">{actual + 1} / {total}</span>
        </p>
        <button type="button" onClick={onCerrar} aria-label="Cerrar"
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Foto actual */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-4 sm:px-16 overflow-hidden"
        onTouchStart={(e) => { toqueX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (toqueX.current == null) return;
          const dx = e.changedTouches[0].clientX - toqueX.current;
          if (Math.abs(dx) > 50) ir(dx < 0 ? 1 : -1);
          toqueX.current = null;
        }}
      >
        <AnimatePresence initial={false} custom={direccion} mode="popLayout">
          <motion.img
            key={actual}
            src={fotos[actual]}
            alt={`Foto ${actual + 1} de ${nombre}`}
            custom={direccion}
            initial={{ opacity: 0, x: direccion * 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direccion * -80 }}
            transition={{ duration: 0.25 }}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </AnimatePresence>

        {total > 1 && (
          <>
            <Flecha lado="izq" onClick={() => ir(-1)} />
            <Flecha lado="der" onClick={() => ir(1)} />
          </>
        )}
      </div>

      {/* Miniaturas */}
      {total > 1 && (
        <div ref={miniaturas} className="flex gap-2 overflow-x-auto px-4 py-4 justify-start sm:justify-center" onClick={(e) => e.stopPropagation()}>
          {fotos.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => { setDireccion(i > actual ? 1 : -1); setActual(i); }}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === actual}
              className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-md overflow-hidden transition-all ${
                i === actual ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>,
    document.body,
  );
}

function Flecha({ lado, onClick }: { lado: 'izq' | 'der'; onClick: () => void }) {
  const Icono = lado === 'izq' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={lado === 'izq' ? 'Foto anterior' : 'Foto siguiente'}
      className={`absolute top-1/2 -translate-y-1/2 ${lado === 'izq' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'} w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur flex items-center justify-center transition-colors`}
    >
      <Icono className="w-6 h-6" />
    </button>
  );
}
