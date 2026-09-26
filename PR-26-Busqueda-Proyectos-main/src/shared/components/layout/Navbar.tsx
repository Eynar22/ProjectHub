import { useState, useRef, useEffect, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useTheme } from '@/app/context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, LogOut, LayoutDashboard, Compass,
  ChevronDown, User as UserIcon, Menu, X, Sun, Moon,
} from 'lucide-react';
import { Avatar } from '@/shared/components/ui/Avatar';

/* Secciones del landing a las que se puede saltar desde el navbar. Los ids
 * están en Home.tsx y en src/shared/components/landing/*. */
const SECCIONES = [
  { id: 'para-quien', label: 'Para quién' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'demo', label: 'Demo' },
  { id: 'impacto', label: 'Impacto ODS' },
  { id: 'preguntas', label: 'Preguntas' },
] as const;

// Avatar encajado perfectamente
function UserAvatar({ name, src }: { name: string; src?: string | null }) {
  return (
    <Avatar
      name={name}
      src={src}
      className="w-7 h-7 rounded-full shadow-sm"
      fallbackClassName="bg-primary text-primary-foreground font-bold text-[11px]"
    />
  );
}

/** Desplaza suavemente hasta una sección (respeta prefers-reduced-motion). */
function irASeccion(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' });
  return true;
}

export function Navbar() {
  const { currentUser, logout, companies } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [conScroll, setConScroll] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const enLanding = location.pathname === '/';
  // Fuera del landing no hay sección activa (se deriva, sin setState en efectos).
  const activa = enLanding ? seccionActiva : null;
  const myCompany = companies.find(c => c.id === currentUser?.empresa_id);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  // La cápsula gana opacidad y sombra al bajar.
  useEffect(() => {
    const onScroll = () => setConScroll(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Al llegar al landing con #seccion (desde otra página), saltar a ella.
  useEffect(() => {
    if (!enLanding || !location.hash) return;
    const id = location.hash.slice(1);
    const t = setTimeout(() => irASeccion(id), 150);
    return () => clearTimeout(t);
  }, [enLanding, location.hash]);

  // Resaltar la sección que se está viendo (solo en el landing).
  useEffect(() => {
    if (!enLanding) return;
    const visibles = new Map<string, number>();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) visibles.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        let mejor: string | null = null;
        let max = 0;
        for (const [id, r] of visibles) if (r > max) { max = r; mejor = id; }
        setSeccionActiva(max > 0 ? mejor : null);
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    // Las secciones pueden montarse un poco después (datos, lazy); se buscan tras un tick.
    const t = setTimeout(() => {
      SECCIONES.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    }, 300);
    return () => { clearTimeout(t); obs.disconnect(); };
  }, [enLanding]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const clickSeccion = (e: ReactMouseEvent, id: string) => {
    setMobileMenuOpen(false);
    if (enLanding && irASeccion(id)) {
      e.preventDefault();
      history.replaceState(null, '', `#${id}`);
    }
    // Si no estamos en el landing, el <Link to="/#id"> navega y el efecto de arriba hace el salto.
  };

  const dashboardPath = currentUser?.rol === 'superadmin' ? '/admin' : '/dashboard';

  return (
    // Navbar delgado (h-14 en móvil, h-16 en PC). Una sola franja de lado a lado
    // (antes: zonas grises a los costados unidas con curvas en "S").
    <div className="sticky top-0 z-sticky w-full h-14 md:h-16 pointer-events-none">
      <nav
        aria-label="Principal"
        className={`pointer-events-auto w-full h-full flex items-center gap-2 px-4 md:px-6 backdrop-blur-md border-b transition-[background-color,box-shadow,border-color] duration-300 ${
          conScroll
            ? 'bg-card/90 border-border/60 shadow-[0_6px_24px_rgba(0,0,0,0.15)]'
            : 'bg-card/70 border-transparent'
        }`}
      >
        {/* 1. Isla izquierda: logo en su cápsula */}
        <Link to="/" className="bg-card px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 shadow-sm border border-border/40 hover:shadow-md transition-all group flex-shrink-0">
          <div className="w-6 h-6 md:w-7 md:h-7 bg-primary rounded-full flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Building2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm md:text-base font-bold text-foreground hidden sm:block tracking-tight">
            ProjectHub
          </span>
        </Link>

        {/* 2. Zona central: secciones del landing + navegación */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-1">
          {!currentUser && SECCIONES.map(s => (
            <Link
              key={s.id}
              to={`/#${s.id}`}
              onClick={(e) => clickSeccion(e, s.id)}
              className={`relative hidden lg:block px-3 py-1.5 text-[13px] font-semibold rounded-full transition-colors ${
                activa === s.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activa === s.id && (
                <motion.span
                  layoutId="nav-activo"
                  className="absolute inset-0 rounded-full bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{s.label}</span>
            </Link>
          ))}
          {!currentUser && <span className="hidden lg:block w-px h-5 bg-border mx-2" aria-hidden="true" />}
          <NavLink to="/explore" icon={<Compass className="w-4 h-4" />} label="Explorar proyectos" current={location.pathname} />
          {currentUser && (
            <NavLink to={dashboardPath} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" current={location.pathname} />
          )}
        </div>
        <div className="flex-1 md:hidden" />

        {/* 3. Isla derecha: tema + cuenta en su cápsula */}
        <div className="bg-card rounded-full p-1 md:p-1.5 flex items-center shadow-sm border border-border/40 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors flex-shrink-0"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-foreground" aria-hidden="true" />
              : <Moon className="w-4 h-4 text-foreground" aria-hidden="true" />}
          </button>

          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 pr-2 md:pr-3 pl-1 min-h-10 rounded-full hover:bg-muted/60 transition-colors group"
                aria-label="Menú de cuenta"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <UserAvatar name={currentUser.nombre_completo} src={currentUser.foto_url} />
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] md:text-xs font-semibold leading-tight max-w-[80px] md:max-w-[90px] truncate text-foreground">
                    {currentUser.nombre_completo.split(' ')[0]}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-64 bg-card border border-border/50 shadow-xl rounded-3xl overflow-hidden p-2 z-dropdown"
                  >
                    <div className="p-3 bg-muted/30 rounded-[1.25rem] mb-2 border-b border-border/30">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={currentUser.nombre_completo} src={currentUser.foto_url} />
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate text-foreground">{currentUser.nombre_completo}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{currentUser.correo}</div>
                          {myCompany && (
                            <div className="text-[10px] text-primary font-bold mt-1 truncate uppercase">{myCompany.nombre}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-1 space-y-1">
                      <DropdownItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" to={dashboardPath} onClick={() => setUserMenuOpen(false)} />
                      <DropdownItem icon={<UserIcon className="w-4 h-4" />} label="Mi Perfil" to="/dashboard/profile" onClick={() => setUserMenuOpen(false)} />
                      <div className="my-1 mx-2 border-t border-border/40" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs text-destructive hover:bg-destructive/10 transition-colors font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex items-center px-1">
              <Link to="/login" className="px-3 py-1.5 md:px-4 md:py-1.5 text-[11px] md:text-xs font-semibold text-foreground hover:bg-muted rounded-full transition-colors">
                Ingresar
              </Link>
              <Link to="/register"
                className="px-4 py-1.5 md:px-5 md:py-1.5 text-[11px] md:text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover rounded-full transition-colors shadow-sm">
                Registro
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen
              ? <X className="w-4 h-4 text-foreground" aria-hidden="true" />
              : <Menu className="w-4 h-4 text-foreground" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Menú Móvil */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-3 right-3 bg-card border border-border/50 shadow-xl rounded-3xl overflow-hidden z-dropdown p-2 mt-1 pointer-events-auto"
          >
            <div className="space-y-1">
              {!currentUser && (
                <>
                  {SECCIONES.map(s => (
                    <Link
                      key={s.id}
                      to={`/#${s.id}`}
                      onClick={(e) => clickSeccion(e, s.id)}
                      className={`block px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                        activa === s.id ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {s.label}
                    </Link>
                  ))}
                  <div className="h-px bg-border/50 my-1 mx-2" />
                </>
              )}
              <MobileNavLink to="/explore" label="Explorar proyectos" />
              {currentUser ? (
                <>
                  <MobileNavLink to={dashboardPath} label="Dashboard" />
                  <MobileNavLink to="/dashboard/profile" label="Mi Perfil" />
                  <div className="h-px bg-border/50 my-1 mx-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink to="/login" label="Iniciar Sesión" />
                  <MobileNavLink to="/register" label="Registrarse" />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavLink({ to, icon, label, current }: { to: string; icon: ReactNode; label: string; current: string }) {
  const isActive = current === to || current.startsWith(to + '/');
  return (
    <Link to={to}
      className={`flex items-center gap-2 px-3 py-1 text-[13px] font-semibold transition-all ${
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      }`}>
      <span className={isActive ? 'text-primary' : 'text-muted-foreground/70'}>{icon}</span>
      {label}
    </Link>
  );
}

function DropdownItem({ icon, label, to, onClick }: { icon: ReactNode; label: string; to: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
      <span className="text-muted-foreground/70">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="block px-4 py-2.5 rounded-2xl text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
      {label}
    </Link>
  );
}
