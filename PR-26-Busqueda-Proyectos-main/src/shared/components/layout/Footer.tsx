import { Link } from 'react-router';

/* Pie de página (Manual 3.4): contacto + enlaces + copyright con año generado
 * dinámicamente.
 * TODO: crear las páginas legales (Privacidad / Términos / Cookies) y enlazarlas
 * aquí — hoy no existen, así que no se enlazan para no generar 404 (Parte 19). */
export function Footer() {
  const anio = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {anio} ProjectHub. Todos los derechos reservados.</p>
        <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/explore" className="rounded transition-colors hover:text-foreground hover:underline">
            Explorar proyectos
          </Link>
          <a
            href="mailto:soporte@projecthub.umaunivalle.com"
            className="rounded transition-colors hover:text-foreground hover:underline"
          >
            Contacto
          </a>
        </nav>
      </div>
    </footer>
  );
}
