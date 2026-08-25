import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, LogOut, LayoutDashboard, Compass, Bell,
  ChevronDown, User as UserIcon, Settings, Menu, X,
  Shield, Crown, Users,
} from 'lucide-react';

function UserAvatar({ name, photoUrl, size = 'sm' }: { name: string; photoUrl?: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`rounded-full object-cover flex-shrink-0 ${sizeClasses}`} />;
  }
  return (
    <div className={`rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white flex-shrink-0 ${sizeClasses}`}>
      {initials}
    </div>
  );
}

export function Navbar() {
  const { currentUser, logout, companies } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const myCompany = companies.find(c => c.id === currentUser?.empresa_id);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const rolLabel = currentUser?.rol === 'superadmin' ? 'Super Admin'
    : currentUser?.rol === 'admin' ? 'Admin Empresa'
      : 'Empleado';

  const dashboardPath = currentUser?.rol === 'superadmin' ? '/admin' : '/dashboard';

  return (
    <>
      <nav className="bg-card/95 border-b border-border sticky top-0 z-50 backdrop-blur-md shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
                ProjectHub
              </span>
            </Link>

            {/* Desktop center nav */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/explore" icon={<Compass className="w-4 h-4" />} label="Explorar" current={location.pathname} />
              {currentUser && (
                <NavLink to={dashboardPath} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" current={location.pathname} />
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                <>
                  {/* User menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(v => !v)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors group"
                    >
                      <UserAvatar name={currentUser.nombre_completo} photoUrl={currentUser.foto_url} />
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-semibold leading-tight max-w-[120px] truncate">
                          {currentUser.nombre_completo.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium leading-tight">
                          {rolLabel}
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                        >
                          {/* User header */}
                          <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-b border-border">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={currentUser.nombre_completo} photoUrl={currentUser.foto_url} size="md" />
                              <div className="min-w-0">
                                <div className="font-bold text-sm truncate">{currentUser.nombre_completo}</div>
                                <div className="text-xs text-muted-foreground truncate">{currentUser.correo}</div>
                                {myCompany && (
                                  <div className="text-xs text-primary font-medium mt-0.5 truncate">{myCompany.nombre}</div>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1.5">
                              {currentUser.rol === 'superadmin' && <Shield className="w-3 h-3 text-purple-500" />}
                              {currentUser.rol === 'admin' && <Crown className="w-3 h-3 text-blue-500" />}
                              {currentUser.rol === 'empleado' && <Users className="w-3 h-3 text-slate-500" />}
                              <span className="text-[11px] font-semibold text-muted-foreground">{rolLabel}</span>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="p-2">
                            <DropdownItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" to={dashboardPath} onClick={() => setUserMenuOpen(false)} />
                            <DropdownItem icon={<UserIcon className="w-4 h-4" />} label="Mi Perfil" to="/dashboard/profile" onClick={() => setUserMenuOpen(false)} />
                            <DropdownItem icon={<Compass className="w-4 h-4" />} label="Explorar Proyectos" to="/explore" onClick={() => setUserMenuOpen(false)} />
                            <div className="my-1 border-t border-border" />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium"
                            >
                              <LogOut className="w-4 h-4" />
                              Cerrar Sesión
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Iniciar Sesión
                  </Link>
                  <Link to="/register"
                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
                    Registrarse
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <div className="p-4 space-y-1">
                <MobileNavLink to="/explore" label="Explorar Proyectos" />
                {currentUser ? (
                  <>
                    <MobileNavLink to={dashboardPath} label="Dashboard" />
                    <MobileNavLink to="/dashboard/profile" label="Mi Perfil" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
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
      </nav>
    </>
  );
}

function NavLink({ to, icon, label, current }: { to: string; icon: React.ReactNode; label: string; current: string }) {
  const isActive = current === to || current.startsWith(to + '/');
  return (
    <Link to={to}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold transition-all border ${isActive
          ? 'bg-primary/10 text-primary border-primary/20'
          : 'text-foreground hover:text-primary hover:bg-primary/5 border-transparent hover:border-primary/10'
        }`}>
      {icon}
      {label}
    </Link>
  );
}

function DropdownItem({ icon, label, to, onClick }: { icon: React.ReactNode; label: string; to: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted transition-colors">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="block px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">
      {label}
    </Link>
  );
}
