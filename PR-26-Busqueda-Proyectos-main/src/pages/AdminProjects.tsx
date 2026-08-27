import { useState, useRef, useEffect } from 'react';
import type { ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import {
  useProyectos,
  useProyectosArchivados,
  useCambiarEstadoProyecto,
  useAutoTerminarProyectos,
  type Project,
} from '@/features/proyectos';
import { useEmpresas } from '@/features/empresas';
import { useUsuarios } from '@/features/usuarios';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { EstadoVacio, EstadoError } from '@/shared/components/feedback';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import {
  FolderKanban,
  Search,
  Calendar,
  Users,
  Eye,
  ChevronDown,
  Archive,
  PlayCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type EstadoFilter = 'todos' | 'en_curso' | 'terminado' | 'archivado';

const ESTADO_CONFIG: Record<string, { bg: string; text: string; label: string; icon: ComponentType<{ className?: string }> }> = {
  en_curso: { bg: 'bg-info-subtle', text: 'text-info-strong', label: 'En Curso', icon: PlayCircle },
  terminado: { bg: 'bg-success-subtle', text: 'text-success-strong', label: 'Terminado', icon: CheckCircle2 },
  archivado: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Archivado', icon: Archive },
};

// ── Portal Dropdown ───────────────────────────────────────────────────────────
function EstadoDropdown({
  projectId,
  currentEstado,
  anchorRef,
  onSelect,
  onClose,
}: {
  projectId: number;
  currentEstado: string;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onSelect: (id: number, estado: 'en_curso' | 'terminado' | 'archivado') => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const options: { key: 'en_curso' | 'terminado' | 'archivado'; label: string; icon: ComponentType<{ className?: string }>; separator?: boolean }[] = [
    { key: 'en_curso', label: 'En Curso', icon: PlayCircle },
    { key: 'terminado', label: 'Terminado', icon: CheckCircle2 },
    { key: 'archivado', label: 'Archivar', icon: Archive, separator: true },
  ];

  return createPortal(
    <div
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 'var(--z-index-popover)' }}
      className="bg-card border border-border rounded-xl shadow-2xl min-w-[160px] overflow-hidden"
    >
      {options.map(opt => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.key}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onSelect(projectId, opt.key); }}
            className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-muted text-sm transition-colors ${opt.separator ? 'border-t border-border text-muted-foreground' : ''
              } ${opt.key === currentEstado ? 'font-semibold text-info-strong bg-info-subtle' : 'text-foreground'}`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {opt.label}
            {opt.key === currentEstado && (
              <span className="ml-auto text-[10px] bg-info-subtle text-info-strong px-1.5 py-0.5 rounded-full font-bold">actual</span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

// ── Estado badge with portal dropdown ────────────────────────────────────────
function EstadoTableCell({
  project,
  isLoading,
  onSelect,
}: {
  project: Project;
  isLoading: boolean;
  onSelect: (id: number, estado: 'en_curso' | 'terminado' | 'archivado') => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const estado = project.estado || 'en_curso';
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.en_curso;
  const Icon = cfg.icon;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        disabled={isLoading}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className={`${cfg.bg} ${cfg.text} px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:shadow-md transition-all cursor-pointer`}
      >
        {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        {cfg.label}
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </button>

      {open && (
        <EstadoDropdown
          projectId={project.id}
          currentEstado={estado}
          anchorRef={btnRef}
          onSelect={(id, e) => { setOpen(false); onSelect(id, e); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminProjects() {
  const { data: companies = [] } = useEmpresas();
  const { data: users = [] } = useUsuarios();
  const { data: projects = [], isError, refetch } = useProyectos();
  const { data: archivedProjects = [] } = useProyectosArchivados();
  const cambiarEstado = useCambiarEstadoProyecto();
  const autoTerminar = useAutoTerminarProyectos();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const allProjects = [...projects, ...archivedProjects];

  const filtered = allProjects.filter((project) => {
    const creator = users.find((u) => u.id === project.creador_id);
    const company = companies.find((c) => c.id === creator?.empresa_id);
    const matchSearch =
      project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = estadoFilter === 'todos' || (project.estado || 'en_curso') === estadoFilter;
    return matchSearch && matchEstado;
  }).sort((a, b) => {
    const dateA = new Date(a.fecha_creacion || a.id).getTime();
    const dateB = new Date(b.fecha_creacion || b.id).getTime();
    return dateB - dateA;
  });

  const counts = {
    todos: allProjects.length,
    en_curso: allProjects.filter((p) => (p.estado || 'en_curso') === 'en_curso').length,
    terminado: allProjects.filter((p) => p.estado === 'terminado').length,
    archivado: archivedProjects.length,
  };

  const handleEstado = async (projectId: number, nuevoEstado: 'en_curso' | 'terminado' | 'archivado') => {
    setLoadingId(projectId);
    try {
      await cambiarEstado.mutateAsync({ id: projectId, estado: nuevoEstado });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleAutoTerminar = () => {
    autoTerminar.mutate();
  };

  const FILTER_TABS: { key: EstadoFilter; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { key: 'todos', label: 'Todos', icon: FolderKanban },
    { key: 'en_curso', label: 'En Curso', icon: PlayCircle },
    { key: 'terminado', label: 'Terminados', icon: CheckCircle2 },
    { key: 'archivado', label: 'Archivados', icon: Archive },
  ];

  return (
    <AppLayout isAdmin mainClassName="flex-1 p-8">
      <Breadcrumbs items={[{ label: "Panel", to: "/admin" }, { label: "Proyectos" }]} />
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Gestión de Proyectos</h1>
                <p className="text-muted-foreground">
                  Administra todos los proyectos — cambia estado, archiva o reactiva
                </p>
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-sm"
                onClick={handleAutoTerminar}
                disabled={autoTerminar.isPending}
              >
                {autoTerminar.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-warning" />}
                Auto-terminar expirados
              </Button>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {FILTER_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setEstadoFilter(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${estadoFilter === tab.key
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${estadoFilter === tab.key ? 'bg-card/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <Card className="p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                aria-label="Buscar proyectos" placeholder="Buscar por nombre, empresa o creador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/70 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm">Proyecto</th>
                    <th className="text-left p-4 font-semibold text-sm">Creador / Empresa</th>
                    <th className="text-left p-4 font-semibold text-sm">Fechas</th>
                    <th className="text-left p-4 font-semibold text-sm">Colaboradores</th>
                    <th className="text-left p-4 font-semibold text-sm">Estado</th>
                    <th className="text-left p-4 font-semibold text-sm">Financiamiento</th>
                    <th className="text-right p-4 font-semibold text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((project, index) => {
                      const creator = users.find((u) => u.id === project.creador_id);
                      const company = companies.find((c) => c.id === creator?.empresa_id);
                      const estado = project.estado || 'en_curso';
                      const isLoading = loadingId === project.id;

                      return (
                        <motion.tr
                          key={project.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`border-b border-border hover:bg-muted/30 transition-colors ${estado === 'archivado' ? 'opacity-60' : ''
                            }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${estado === 'archivado' ? 'bg-muted' : 'bg-primary'
                                }`}>
                                <FolderKanban className={`w-5 h-5 ${estado === 'archivado' ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
                              </div>
                              <div>
                                <div className="font-semibold flex items-center gap-2">
                                  {project.nombre}
                                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                    {project.categoria || 'Tecnología'}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {project.descripcion_corta || project.descripcion_completa}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0">
                                {creator?.nombre_completo?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{creator?.nombre_completo || 'Sin creador'}</div>
                                {company && <div className="text-xs text-muted-foreground">{company.nombre}</div>}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Inicio: {project.fecha_inicio ? new Date(project.fecha_inicio).toLocaleDateString('es-ES') : '—'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Fin: {project.fecha_fin ? new Date(project.fecha_fin).toLocaleDateString('es-ES') : '—'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary" />
                              <span className="font-medium">{project.participantes?.length || 0}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <EstadoTableCell
                              project={project}
                              isLoading={isLoading}
                              onSelect={handleEstado}
                            />
                          </td>

                          <td className="p-4">
                            {project.financiamiento ? (
                              <span className="text-success font-semibold text-sm">
                                {Number(project.financiamiento).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <Link to={`/project/${project.id}`}>
                              <Button variant="outline" size="sm" className="flex items-center gap-2 ml-auto">
                                <Eye className="w-4 h-4" />
                                Ver
                              </Button>
                            </Link>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>

              {isError ? (
                <EstadoError
                  titulo="No pudimos cargar los proyectos"
                  onReintentar={() => refetch()}
                />
              ) : filtered.length === 0 && (
                <EstadoVacio
                  icono={FolderKanban}
                  titulo="Sin resultados"
                  descripcion={searchTerm ? "Intenta con otro término de búsqueda" : `No hay proyectos en estado ""`}
                />
              )}
            </div>
          </Card>
    </AppLayout>
  );
}
