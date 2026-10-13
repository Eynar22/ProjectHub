/* ============================================================================
 * src/pages/portada/NavPortada.tsx
 * Barra superior de las páginas públicas con el estilo de la portada
 * (directorio de empresas, proyectos…). A la derecha: "Ingresar" o, con
 * sesión, "Ir a mi panel".
 * ========================================================================= */

import { Link, useLocation } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import s from './NavPortada.module.css';

const ENLACES = [
  { a: '/#como-funciona', t: 'Cómo funciona' },
  { a: '/explore', t: 'Proyectos' },
  { a: '/empresas', t: 'Empresas' },
  { a: '/#preguntas', t: 'Preguntas' },
];

export function NavPortada() {
  const { currentUser } = useApp();
  const { pathname } = useLocation();
  return (
    <nav className={s.nav} aria-label="Principal">
      <Link to="/" className={s.logo}><i />ProjectHub</Link>
      <ul className={s.enlaces}>
        {ENLACES.map(e => (
          <li key={e.a}>
            {/* Los enlaces a secciones de la portada van con <a> para que el navegador baje hasta ellas. */}
            {e.a.includes('#')
              ? <a href={e.a}>{e.t}</a>
              : <Link to={e.a} className={pathname === e.a ? s.actual : undefined} aria-current={pathname === e.a ? 'page' : undefined}>{e.t}</Link>}
          </li>
        ))}
      </ul>
      {currentUser
        ? <Link to={currentUser.rol === 'superadmin' ? '/admin' : '/dashboard'} className={s.cuenta}>Ir a mi panel</Link>
        : <Link to="/login" className={s.cuenta}>Ingresar</Link>}
    </nav>
  );
}
