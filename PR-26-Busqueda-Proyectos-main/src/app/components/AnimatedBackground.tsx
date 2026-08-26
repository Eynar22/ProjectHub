import { motion } from 'motion/react';

/**
 * Fondo global de la app: esferas borrosas animadas sobre un lienzo claro.
 * Se monta una sola vez en App.tsx con position fixed y z-index negativo,
 * así queda siempre detrás del contenido de cualquier página sin que cada
 * página tenga que declarar su propio fondo.
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-slate-950 pointer-events-none">
      {/* Esfera 1: Morada (Superior izquierda) */}
      <motion.div
        animate={{
          x: [0, 150, -50, 0],
          y: [0, -100, 120, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-[120px] opacity-80"
      />

      {/* Esfera 2: Azul (Inferior derecha) */}
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 100, -150, 0],
          scale: [0.9, 1.2, 1, 0.9],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-[120px] opacity-70"
      />

      {/* Esfera 3: Fucsia suave (Central, cruza toda la pantalla) */}
      <motion.div
        animate={{
          x: [0, 100, -150, 0],
          y: [0, -50, 100, 0],
          scale: [0.8, 1.2, 0.9, 0.8],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-fuchsia-400/20 dark:bg-fuchsia-600/10 rounded-full blur-[100px] opacity-60"
      />
    </div>
  );
}
