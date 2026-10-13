/* ============================================================================
 * src/pages/acceso/AccesoLayout.tsx
 * Marco común de las páginas de acceso (login, registro, contraseñas) con el
 * estilo de la portada: barra con el logo, formulario a la izquierda y un
 * panel ilustrado a la derecha. Separado del sistema (no usa el tema global).
 * ========================================================================= */

import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import s from './Acceso.module.css';

const FUENTE = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap';

/** Carga la fuente Geist mientras la página está abierta. */
function useFuenteGeist() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FUENTE}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FUENTE;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);
}

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

export function AccesoLayout({ navDerecha, panel, ancho = false, children }: {
  /** Contenido a la derecha de la barra (p. ej. "¿No tienes cuenta? Crear cuenta"). */
  navDerecha?: ReactNode;
  /** Ilustración de la columna derecha. Sin panel, el contenido va centrado. */
  panel?: ReactNode;
  /** Columnas más anchas para formularios largos (registro). */
  ancho?: boolean;
  children: ReactNode;
}) {
  useFuenteGeist();
  return (
    <div className={s.raiz}>
      <nav className={s.nav} aria-label="Principal">
        <Link to="/" className={s.logo}><i />ProjectHub</Link>
        {navDerecha && <div className={s.navDer}>{navDerecha}</div>}
      </nav>
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

