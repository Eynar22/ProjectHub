import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

/**
 * Número que cuenta de 0 al valor la primera vez que entra en pantalla.
 * Con `prefers-reduced-motion` muestra el valor directamente.
 */
export function Contador({ valor, duracion = 1.4 }: { valor: number; duracion?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.6 });
  const reducir = useReducedMotion();
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (reducir) { setMostrado(valor); return; }
    const control = animate(0, valor, {
      duration: duracion,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setMostrado(Math.round(v)),
    });
    return () => control.stop();
  }, [visible, valor, reducir, duracion]);

  return <span ref={ref}>{mostrado}</span>;
}
