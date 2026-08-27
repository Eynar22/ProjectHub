import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

/* Shell común de las pantallas autenticadas (Anexo B2):
 * enlace "saltar al contenido" + Navbar + Sidebar + <main id="contenido"> + Footer.
 * Garantiza un solo <main> por página y estructura semántica consistente. */
export function AppLayout({
  children,
  isAdmin = false,
  sinSidebar = false,
  sinFooter = false,
  /** clases extra para el <main> (padding, ancho máx, etc.). */
  mainClassName = 'flex-1 p-8',
}: {
  children: ReactNode;
  isAdmin?: boolean;
  sinSidebar?: boolean;
  sinFooter?: boolean;
  mainClassName?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast
          focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <div className="flex flex-1">
        {!sinSidebar && <Sidebar isAdmin={isAdmin} />}
        <main id="contenido" tabIndex={-1} className={mainClassName}>
          {children}
        </main>
      </div>
      {!sinFooter && <Footer />}
    </div>
  );
}
