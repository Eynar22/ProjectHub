/* ============================================================================
 * src/pages/proyecto/piezas.tsx
 * Piezas compartidas de las páginas de detalle (proyecto y empresa):
 *  - FotosHero: fotos que rotan solas con fundido y un zoom lento.
 *  - Revelar: bloque que entra suave (de borroso a nítido) al aparecer.
 * Estilos en Detalle.module.css.
 * ========================================================================= */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import s from './Detalle.module.css';

/** Fotos del hero: rotan solas con fundido y un zoom lento. */
export function FotosHero({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [actual, setActual] = useState(0);
  useEffect(() => {
    if (fotos.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setActual(i => (i + 1) % fotos.length), 5000);
    return () => clearInterval(t);
  }, [fotos.length]);
  if (!fotos.length) return <Building2 className={s.sinFoto} aria-hidden="true" />;
  return (
    <>
      {fotos.map((url, i) => (
        <img key={url + i} src={url} alt={i === actual ? `${nombre}, foto ${i + 1} de ${fotos.length}` : ''} className={`${s.foto} ${i === actual ? s.fotoOn : ''}`} />
      ))}
      {fotos.length > 1 && (
        <span className={s.puntos} aria-hidden="true">{fotos.map((_, i) => <i key={i} className={i === actual ? s.on : ''} />)}</span>
      )}
    </>
  );
}

/** Bloque que entra suave (de borroso a nítido) cuando aparece en pantalla. */
export function Revelar({ children, className = '', retraso = 0, id }: { children: ReactNode; className?: string; retraso?: number; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} id={id} className={`${className} ${s.revelar} ${visible ? s.visible : ''}`} style={{ transitionDelay: `${retraso}s` }}>
      {children}
    </div>
  );
}
