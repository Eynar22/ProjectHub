import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import { useProyectos, useProyectosArchivados } from '@/features/proyectos';
import type { Project } from '@/features/proyectos';
import {
  LayoutDashboard, FolderKanban, Building2, Users,
  Plus, Search, UserCheck, PanelLeftClose, PanelLeftOpen,
  Archive, CheckCircle2, PlayCircle,
} from 'lucide-react';

type IconoLucide = ComponentType<{ className?: string }>;

interface SidebarProps {
  isAdmin?: boolean;
}

const STORAGE_KEY = 'sidebar_collapsed';

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const location = useLocation();
  const { currentUser } = useApp();
  const { data: projects = [] } = useProyectos();
  const { data: archivedProjects = [] } = useProyectosArchivados(!!currentUser);

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch { return false; }
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
  };

  const myId = currentUser?.id;
  const isParticipant = (p: Project) =>
    p.creador_id === myId || p.participantes?.some((pa) => pa.usuario_id === myId);

  const activeProjects  = projects.filter(p => isParticipant(p) && (p.estado || 'en_curso') === 'en_curso').length;
  const doneProjects    = projects.filter(p => isParticipant(p) && p.estado === 'terminado').length;
  const archivedCount   = archivedProjects.filter(p => p.creador_id === myId).length;

  const baseLinks = [
    { to: '/dashboard',                icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/projects',       icon: FolderKanban,    label: 'Mis Proyectos', badge: activeProjects || undefined },
    { to: '/dashboard/create-project', icon: Plus,            label: 'Crear Proyecto' },
    { to: '/explore',                  icon: Search,          label: 'Explorar' },
    { to: '/dashboard/profile',        icon: Building2,       label: 'Mi Perfil' },
  ];

  const adminLinks = [
    { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/companies', icon: Building2,       label: 'Empresas' },
    { to: '/admin/projects',  icon: FolderKanban,    label: 'Proyectos' },
    { to: '/admin/users',     icon: Users,           label: 'Usuarios' },
  ];

  const companyAdminLinks = [
    ...baseLinks,
    { to: '/dashboard/members', icon: UserCheck, label: 'Gestión de Miembros' },
  ];

  let links: { to: string; icon: IconoLucide; label: string; badge?: number }[] = adminLinks;
  if (!isAdmin) {
    links = currentUser?.rol === 'admin' ? companyAdminLinks : baseLinks;
  }

  const isCollapsed = isMobile ? true : collapsed;

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative bg-sidebar border-r border-sidebar-border h-[calc(100dvh-4rem)] sticky top-16 flex-shrink-0 flex flex-col overflow-hidden"
    >
      {/* Toggle button — full row at top, hidden on mobile */}
      {!isMobile && (
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
          aria-expanded={!collapsed}
          className={`flex items-center gap-2.5 w-full border-b border-sidebar-border transition-colors hover:bg-sidebar-accent group
            ${isCollapsed ? 'justify-center py-3.5 px-0' : 'px-4 py-3'}`}
        >
          {collapsed
            ? <PanelLeftOpen  className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" aria-hidden="true" />
            : <PanelLeftClose className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" aria-hidden="true" />
          }
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors whitespace-nowrap overflow-hidden"
              >
                Ocultar menú
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      )}

      {/* Nav links */}
      <nav aria-label="Navegación principal" className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden pt-3">
        {links.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to ||
            (link.to !== '/dashboard' && link.to !== '/admin' && location.pathname.startsWith(link.to));

          return (
            <Link
              key={link.to}
              to={link.to}
              aria-label={link.label}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? link.label : undefined}
            >
              <div className={`relative flex items-center rounded-xl transition-all group cursor-pointer
                ${isCollapsed ? 'justify-center py-3 px-2 mx-1' : 'gap-3 px-3 py-2.5'}
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground/50 rounded-r-full -ml-2" />
                )}

                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="text-sm font-medium whitespace-nowrap flex-1"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Badge */}
                {link.badge !== undefined && link.badge > 0 && (
                  <span className={`text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0
                    ${isActive ? 'bg-primary-foreground/30 text-primary-foreground' : 'bg-primary text-primary-foreground'}
                    ${isCollapsed ? 'absolute -top-1 -right-1 w-4 h-4' : 'w-5 h-5'}`}>
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}

                {/* Tooltip (collapsed only) */}
                {isCollapsed && (
                  <span className="absolute left-full ml-3 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg
                    whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-popover shadow-xl
                    translate-x-1 group-hover:translate-x-0">
                    {link.label}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-foreground" />
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Stats panel (expanded, non-admin only) */}
      <AnimatePresence>
        {!isCollapsed && !isAdmin && currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 border-t border-sidebar-border"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
              Mis Proyectos
            </p>
            <div className="space-y-0.5">
              <StatRow icon={PlayCircle}   label="Activos"    value={activeProjects} color="text-info-strong"    bg="bg-info-subtle" />
              <StatRow icon={CheckCircle2} label="Terminados" value={doneProjects}   color="text-success-strong" bg="bg-success-subtle" />
              <StatRow icon={Archive}      label="Archivados" value={archivedCount}  color="text-muted-foreground" bg="bg-muted" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

function StatRow({ icon: Icon, label, value, color, bg }: {
  icon: IconoLucide; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors">
      <div className={`${bg} p-1 rounded-md`}>
        <Icon className={`w-3 h-3 ${color}`} />
      </div>
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className="text-xs font-bold tabular-nums">{value}</span>
    </div>
  );
}
