import { ButtonHTMLAttributes } from 'react';
import { motion } from 'motion/react';

/**
 * Jerarquía de botones (Anexo A8 / Manual 8.1).
 * - primary: 1 por pantalla. Fondo sólido de marca, hover P-700, activo P-800.
 * - secondary / outline: borde neutro, fondo transparente.
 * - ghost: solo texto, sin borde ni fondo.
 * - destructive: variante roja, solo para acciones destructivas.
 * - success / warning: acciones semánticas puntuales (aprobar / advertir).
 */
// Se omiten los handlers que chocan entre React DOM y motion.
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onDragStart' | 'onDrag' | 'onDragEnd'
>;

interface ButtonProps extends NativeButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
  secondary: 'border border-input bg-transparent text-foreground hover:bg-muted',
  outline: 'border border-input bg-transparent text-foreground hover:bg-muted',
  accent: 'border border-input bg-transparent text-foreground hover:bg-muted',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:brightness-95 active:brightness-90',
  success: 'bg-success text-success-foreground hover:brightness-95 active:brightness-90',
  warning: 'bg-warning text-warning-foreground hover:brightness-95 active:brightness-90',
};

/* Altura mínima táctil 44px en md/lg (Manual 8.1 / 10.6). */
const SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-9 px-4 py-2 text-sm',
  md: 'min-h-11 px-6 py-3',
  lg: 'min-h-12 px-8 py-4 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium leading-none ' +
    'transition-colors duration-150 ease-out ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${base} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
