import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <motion.div
      /* Hover sutil: elevación + desplazamiento -2px, sin agrandar (Manual 8.5). */
      whileHover={hover ? { y: -2 } : undefined}
      className={
        `bg-card rounded-xl border border-border shadow-sm transition-shadow duration-150 ease-out ` +
        (hover ? 'hover:shadow-md ' : '') +
        (onClick ? 'cursor-pointer ' : '') +
        className
      }
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
