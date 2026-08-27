import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useTheme } from '@/app/context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, LogOut, LayoutDashboard, Compass,
  ChevronDown, User as UserIcon, Menu, X, Sun, Moon,
} from 'lucide-react';

// Avatar encajado perfectamente
function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground text-[11px] shadow-sm flex-shrink-0">
      {initials}
    </div>
  );
}

export function Navbar() {
  const { currentUser, logout, companies } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  const dashboardPath = currentUser?.rol === 'superadmin' ? '/admin' : '/dashboard';

  return (
    // Navbar delgado (h-14 en móvil, h-16 en PC)
    <div className="sticky top-0 z-sticky w-full h-14 md:h-16 flex pointer-events-none">
      
      {/* ======================================= */}
      {/* 1. ISLA IZQUIERDA (Plomo + Curva S)     */}
      {/* ======================================= */}
      
      {/* Zona sólida Ploma (Más transparente) */}
      <div className="bg-foreground/5 backdrop-blur-md flex items-center pl-4 md:pl-6 pr-1 h-full pointer-events-auto">
        <Link to="/" className="bg-card px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 shadow-sm border border-border/40 hover:shadow-md transition-all group">
          <div className="w-6 h-6 md:w-7 md:h-7 bg-primary rounded-full flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Building2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm md:text-base font-bold text-foreground hidden sm:block tracking-tight">
            ProjectHub
          </span>
        </Link>
      </div>
      
      {/* Curva de transición Izquierda */}
      <div className="relative w-8 md:w-12 h-full flex-shrink-0 pointer-events-auto">
        {/* Capa Blanca (Ligeramente transparente) */}
        <div 
          className="absolute inset-0 bg-card/85 backdrop-blur-md"
          style={{ 
            maskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,0C50,0,50,100,100,100V0Z' fill='black'/%3E%3C/svg%3E")`,
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,0C50,0,50,100,100,100V0Z' fill='black'/%3E%3C/svg%3E")`,
            maskSize: '100% 100%', WebkitMaskSize: '100% 100%'
          }} 
        />
        {/* Capa Ploma (Muy transparente) */}
        <div 
          className="absolute inset-0 bg-foreground/5 backdrop-blur-md"
          style={{ 
            maskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,0C50,0,50,100,100,100H0Z' fill='black'/%3E%3C/svg%3E")`,
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,0C50,0,50,100,100,100H0Z' fill='black'/%3E%3C/svg%3E")`,
            maskSize: '100% 100%', WebkitMaskSize: '100% 100%'
          }} 
        />
      </div>

      {/* ======================================= */}
      {/* 2. ZONA CENTRAL (Blanca semi-transparente) */}
      {/* ======================================= */}
      <div className="flex-1 bg-card/85 backdrop-blur-md flex items-center justify-center h-full px-2 z-10 pointer-events-auto">
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/explore" icon={<Compass className="w-4 h-4" />} label="Explorar Proyectos" current={location.pathname} />
          
          {currentUser && (
            <NavLink to={dashboardPath} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" current={location.pathname} />
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* 3. ISLA DERECHA (Curva S + Plomo)       */}
      {/* ======================================= */}
      
      {/* Curva de transición Derecha */}
      <div className="relative w-8 md:w-12 h-full flex-shrink-0 pointer-events-auto">
        {/* Capa Blanca (Ligeramente transparente) */}
        <div 
          className="absolute inset-0 bg-card/85 backdrop-blur-md"
          style={{ 
            maskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100,0C50,0,50,100,0,100V0Z' fill='black'/%3E%3C/svg%3E")`,
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100,0C50,0,50,100,0,100V0Z' fill='black'/%3E%3C/svg%3E")`,
            maskSize: '100% 100%', WebkitMaskSize: '100% 100%'
          }} 
        />
        {/* Capa Ploma (Muy transparente) */}
        <div 
          className="absolute inset-0 bg-foreground/5 backdrop-blur-md"
          style={{ 
            maskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100,0C50,0,50,100,0,100H100Z' fill='black'/%3E%3C/svg%3E")`,
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100,0C50,0,50,100,0,100H100Z' fill='black'/%3E%3C/svg%3E")`,
            maskSize: '100% 100%', WebkitMaskSize: '100% 100%'
          }} 
        />
      </div>

      {/* Zona sólida Ploma (Más transparente) */}
      <div className="bg-foreground/5 backdrop-blur-md flex items-center pr-4 md:pr-6 pl-1 h-full pointer-events-auto">
        <div className="bg-card rounded-full p-1 md:p-1.5 flex items-center shadow-sm border border-border/40">

          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors flex-shrink-0"
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
                className="flex items-center gap-2 pr-2 md:pr-3 pl-0.5 md:pl-1 py-0.5 rounded-full hover:bg-muted/50 transition-colors group"
                aria-label="Menú de cuenta"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <UserAvatar name={currentUser.nombre_completo} />
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
                        <UserAvatar name={currentUser.nombre_completo} />
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
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen
              ? <X className="w-4 h-4 text-foreground" aria-hidden="true" />
              : <Menu className="w-4 h-4 text-foreground" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menú Móvil */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-4 right-4 bg-card border border-border/50 shadow-xl rounded-3xl overflow-hidden z-dropdown p-2 mt-2 pointer-events-auto"
          >
            <div className="space-y-1">
              <MobileNavLink to="/explore" label="Explorar Proyectos" />
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

function NavLink({ to, icon, label, current }: { to: string; icon: React.ReactNode; label: string; current: string }) {
  const isActive = current === to || current.startsWith(to + '/');
  return (
    <Link to={to}
      className={`flex items-center gap-2 px-1 py-1 text-[13px] font-semibold transition-all ${
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      }`}>
      <span className={isActive ? 'text-primary' : 'text-muted-foreground/70'}>{icon}</span>
      {label}
    </Link>
  );
}

function DropdownItem({ icon, label, to, onClick }: { icon: React.ReactNode; label: string; to: string; onClick: () => void }) {
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