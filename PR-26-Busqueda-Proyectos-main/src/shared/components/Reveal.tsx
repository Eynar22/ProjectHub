import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Reveal al hacer scroll: el bloque entra con fade + subida + un breve desenfoque.
 * `once` para que no se repita, y respeta `prefers-reduced-motion` (solo fade).
 * Curva = --ease-out del sistema. `delay` para escalonar hermanos.
 */
interface RevealProps {
  children: ReactNode;
  delay?: number;
  /** Desplazamiento vertical inicial en px. */
  y?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 28, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
