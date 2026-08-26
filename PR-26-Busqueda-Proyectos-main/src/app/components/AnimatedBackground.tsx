import { motion } from 'motion/react';

/**
 * Fondo global de la app: esferas borrosas animadas sobre un lienzo claro.
 * Se monta una sola vez en App.tsx con position fixed y z-index negativo,
 * así queda siempre detrás del contenido de cualquier página sin que cada
 * página tenga que declarar su propio fondo.
 *
 * Los colores salen de las variables de theme.css (--background, --primary,
 * --secondary, --accent), no de la paleta fija de Tailwind: si cambias esos
 * tokens (o el modo claro/oscuro), el fondo los sigue solo.
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--background)] pointer-events-none">
      {/* Esfera 1: --secondary (Superior izquierda) */}
      <motion.div
        animate={{
          x: [0, 150, -50, 0],
          y: [0, -100, 120, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[var(--secondary)]/30 dark:bg-[var(--secondary)]/20 rounded-full blur-[120px] opacity-80"
      />

      {/* Esfera 2: --primary (Inferior derecha) */}
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 100, -150, 0],
          scale: [0.9, 1.2, 1, 0.9],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] bg-[var(--primary)]/30 dark:bg-[var(--primary)]/20 rounded-full blur-[120px] opacity-70"
      />

      {/* Esfera 3: --accent (Central, cruza toda la pantalla) */}
      <motion.div
        animate={{
          x: [0, 100, -150, 0],
          y: [0, -50, 100, 0],
          scale: [0.8, 1.2, 0.9, 0.8],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-[var(--accent)]/20 dark:bg-[var(--accent)]/10 rounded-full blur-[100px] opacity-60"
      />
    </div>
  );
}
