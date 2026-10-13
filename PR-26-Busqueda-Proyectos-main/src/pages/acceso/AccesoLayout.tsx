/* ============================================================================
 * src/pages/acceso/AccesoLayout.tsx
 * Marco común de las páginas de acceso (login, registro, contraseñas) con el
 * estilo de la portada: barra con el logo, formulario a la izquierda y un
 * panel ilustrado a la derecha. Separado del sistema (no usa el tema global).
 * ========================================================================= */

import type { ReactNode } from 'react';
import { Navbar } from '@/shared/components/layout/Navbar';
import { ArrowLeft } from 'lucide-react';
import s from './Acceso.module.css';

/** Título que entra palabra por palabra (de borroso a nítido). */
export function TituloAnimado({ texto, retraso = 0 }: { texto: string; retraso?: number }) {
  return (
    <h1 className={s.titulo}>
      {texto.split(' ').map((w, i) => (
        <span key={i} className={s.w} style={{ animationDelay: `${retraso + i * 0.07}s` }}>{w} </span>
      ))}
    </h1>
  );
}

/** Encabezado común de los formularios de acceso. */
export function EncabezadoAcceso({ eyebrow, titulo, texto, onVolver }: {
  eyebrow: string;
  titulo: string;
  texto?: ReactNode;
  onVolver?: () => void;
}) {
  return (
    <header>
      {onVolver && (
        <button type="button" className={s.volver} onClick={onVolver}>
          <ArrowLeft size={16} /> Volver
        </button>
      )}
      <p className={`${s.eyebrow} ${s.aparece}`}>{eyebrow}</p>
      <TituloAnimado texto={titulo} retraso={0.1} />
      {texto && <p className={s.sub}>{texto}</p>}
    </header>
  );
}

export function AccesoLayout({ panel, ancho = false, children }: {
  /** Ilustración de la columna derecha. Sin panel, el contenido va centrado. */
  panel?: ReactNode;
  /** Columnas más anchas para formularios largos (registro). */
  ancho?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={s.raiz}>
      <Navbar />
      {panel ? (
        <main className={`${s.cuerpo} ${ancho ? s.ancho : ''}`}>
          <div className={s.form}>{children}</div>
          {panel}
        </main>
      ) : (
        <main style={{ flex: 1, display: 'grid' }}>{children}</main>
      )}
    </div>
  );
}

