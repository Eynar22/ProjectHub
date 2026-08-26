import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import {
  ArrowLeft,
  Info,
  Users,
  MessageSquare,
  ListTodo,
  Send,
  Paperclip,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Folder,
  FolderPlus,
  Trash2,
  ExternalLink,
  FilePlus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  X,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  Mail,
  Briefcase,
  Image,
  Upload,
  Loader2,
  AlertOctagon,
  Pencil
} from 'lucide-react';
import { motion } from 'motion/react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Task, Project } from '../context/AppContext';

type TabType = 'info' | 'team' | 'chat' | 'tasks' | 'resources' | 'solicitudes';

interface ProyectoSolicitud {
  id: number;
  proyecto_id: number;
  usuario_id: number;
  mensaje: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  fecha_creacion: string;
  usuario?: {
    id: number;
    nombre_completo: string;
    correo: string;
    cargo?: string;
    empresa_id?: number;
  };
}

// ── ASSIGNEE SELECTOR ─────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-blue-500',
  'from-lime-400 to-green-500',
];

function AssigneeSelector({
  participants,
  selected,
  onChange,
  compact = false,
}: {
  participants: { id: number; nombre_completo: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
  compact?: boolean;
}) {
  const unselected = participants.filter(u => !selected.includes(u.id));
  const selectedUsers = participants.filter(u => selected.includes(u.id));

  const getColor = (userId: number) => {
    const idx = participants.findIndex(p => p.id === userId);
    return AVATAR_COLORS[Math.abs(idx) % AVATAR_COLORS.length];
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-2">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Asignar a</span>
        {selectedUsers.length > 0 && (
          <span className="ml-auto text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">
            {selectedUsers.length} seleccionado{selectedUsers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Selected pills — each has an X to remove */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedUsers.map(u => (
            <div
              key={u.id}
              className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 border border-primary/30 text-primary"
            >
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getColor(u.id)} flex items-center justify-center text-white text-[9px] font-black flex-shrink-0`}>
                {u.nombre_completo.charAt(0).toUpperCase()}
              </div>
              <span>{compact ? u.nombre_completo.split(' ')[0] : u.nombre_completo}</span>
              <button
                type="button"
                onClick={() => onChange(selected.filter(id => id !== u.id))}
                className="ml-0.5 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10 p-0.5"
                title={`Quitar ${u.nombre_completo}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Combobox — only shows unassigned members */}
      {unselected.length > 0 ? (
        <div className="relative">
          <select
            value=""
            onChange={e => {
              if (e.target.value) {
                onChange([...selected, Number(e.target.value)]);
                e.target.value = '';
              }
            }}
            className="w-full appearance-none pl-3 pr-8 py-2 bg-muted/50 border border-input rounded-xl text-sm text-muted-foreground cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="">＋ Agregar persona...</option>
            {unselected.map(u => (
              <option key={u.id} value={u.id}>{u.nombre_completo}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      ) : participants.length > 0 ? (
        <p className="text-xs text-muted-foreground/60 italic">Todos los miembros ya están asignados</p>
      ) : (
        <p className="text-xs text-muted-foreground/60 italic">Sin participantes en el proyecto</p>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onMove,
  onClick
}: {
  task: any;
  onMove: (taskId: number, newColId: number) => void;
  onClick: (task: any) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, columna_id: task.columna_id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  })) as any;

  const priorityConfig = {
    alta: { label: 'Alta', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
    media: { label: 'Media', cls: 'bg-warning/10 text-warning border-warning/20' },
    baja: { label: 'Baja', cls: 'bg-success/10 text-success border-success/20' },
  };
  const prio = priorityConfig[task.prioridad as 'alta' | 'media' | 'baja'] || priorityConfig.baja;

  // Multi-assignees: API returns task.usuarios[]
  const assignees: { id: number; nombre_completo: string }[] = task.usuarios ?? [];
  const AVATAR_COLORS = [
    'bg-gradient-to-br from-primary to-purple-500',
    'bg-gradient-to-br from-accent to-success',
    'bg-gradient-to-br from-warning to-orange-500',
    'bg-gradient-to-br from-pink-500 to-rose-500',
  ];

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.4 : 1 }} className="cursor-grab active:cursor-grabbing">
      <Card
        className="p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all mb-3 border-none shadow-sm"
        onClick={() => onClick(task)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-sm leading-tight flex-1 mr-2">{task.titulo}</h4>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold flex-shrink-0 ${prio.cls}`}>
            {prio.label}
          </span>
        </div>

        {task.descripcion && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.descripcion}</p>
        )}

        {/* Multi-assignee avatar stack */}
        {assignees.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex -space-x-2">
              {assignees.slice(0, 3).map((u, i) => (
                <div
                  key={u.id}
                  title={u.nombre_completo}
                  className={`w-6 h-6 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[9px] font-black ring-2 ring-background`}
                >
                  {u.nombre_completo.charAt(0).toUpperCase()}
                </div>
              ))}
              {assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground ring-2 ring-background">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {assignees.length === 1
                ? assignees[0].nombre_completo
                : `${assignees.length} asignados`}
            </span>
          </div>
        )}

        {task.fecha_limite && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(task.fecha_limite).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
          </div>
        )}
      </Card>
    </div>
  );
}

function TaskColumn({
  title,
  columna_id,
  tasks,
  onDrop,
  onEditTask
}: {
  title: string;
  columna_id: number;
  tasks: any[];
  onDrop: (taskId: number, newColId: number) => void;
  onEditTask: (task: any) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: number; columna_id: number }) => {
      if (item.columna_id !== columna_id) {
        onDrop(item.id, columna_id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })) as any;

  const colColors: Record<string, string> = {
    'Por Hacer': 'border-t-slate-400',
    'En Proceso': 'border-t-warning',
    'Completado': 'border-t-success',
  };
  const topColor = colColors[title] || 'border-t-primary';

  return (
    <div ref={drop} className={`flex-1 min-w-[300px] max-w-[360px]`}>
      <div className={`bg-muted/30 rounded-2xl border border-border/50 border-t-4 ${topColor} ${isOver ? 'ring-2 ring-primary ring-inset' : ''} min-h-[500px] transition-all`}>
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight text-foreground">{title}</h3>
            <span className="bg-background text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">
              {tasks.length}
            </span>
          </div>
        </div>
        <div className="px-3 pb-3 space-y-2">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onMove={onDrop} onClick={onEditTask} />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/40">
              <p className="text-xs">Arrastra aquí</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Workspace() {
  const { id } = useParams();
  const {
    projects,
    archivedProjects,
    companies,
    users,
    currentUser,
    resources,
    addResource,
    deleteResource,
    openBase64,
    uploadFile
  } = useApp();

  // ── LOCAL CHAT STATE (loaded per project) ──────────────────────────
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    chat_id: number;
    usuario_id: number;
    contenido: string;
    archivo_url?: string;
    fecha: string;
    usuario?: { nombre_completo: string; cargo?: string };
  }>>([]);
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── LOCAL TASKS STATE (loaded per project) ──────────────────────────
  const [kanbanColumns, setKanbanColumns] = useState<Array<{ id: number; nombre: string; orden: number }>>([]);
  const [localTasks, setLocalTasks] = useState<Array<{
    id: number;
    proyecto_id: number;
    columna_id: number;
    usuario_id?: number;
    titulo: string;
    descripcion?: string;
    prioridad: 'baja' | 'media' | 'alta';
    fecha_limite?: string;
    orden: number;
    usuario?: { id: number; nombre_completo: string };
    comentarios?: Array<{ id: number; usuario_id: number; texto: string; fecha_creacion: string; usuario?: { nombre_completo: string } }>;
  }>>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  // ─────────────────────────────────────────────────────────────────

  // Project join requests — fetched locally per project
  const [projectJoinRequests, setProjectJoinRequests] = useState<ProyectoSolicitud[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [messageText, setMessageText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'baja' | 'media' | 'alta'>('media');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskAssignees, setNewTaskAssignees] = useState<number[]>([]);

  // Task Editing Modal State
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<'baja' | 'media' | 'alta'>('media');
  const [editTaskDeadline, setEditTaskDeadline] = useState('');
  const [editTaskAssignees, setEditTaskAssignees] = useState<number[]>([]);
  const [newTaskComment, setNewTaskComment] = useState('');

  // Resources State
  const [currentFolderId, setCurrentFolderId] = useState<number | undefined>(undefined);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Project Info Editing State (Administrador de Empresa: foto, descripción, fecha fin)
  const [editingProjectInfo, setEditingProjectInfo] = useState(false);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editFechaFin, setEditFechaFin] = useState('');
  const [editImagenes, setEditImagenes] = useState<string[]>([]);
  const [uploadingProjectImage, setUploadingProjectImage] = useState(false);
  const [savingProjectInfo, setSavingProjectInfo] = useState(false);
  const projectImageInputRef = useRef<HTMLInputElement>(null);

  const projectLigero = projects.find(p => p.id === Number(id)) || archivedProjects.find(p => p.id === Number(id));

  // Los recursos (documentos/PDFs del proyecto) pesan mucho en base64 y no vienen en el
  // listado general — se piden solo acá, al entrar al workspace de este proyecto.
  const [projectCompleto, setProjectCompleto] = useState<Project | null>(null);
  const project = projectCompleto ?? projectLigero;

  const isReadOnly = project ? (project.suspendido || project.estado === 'archivado' || project.estado === 'terminado') : false;
  const creator = project ? users.find(u => u.id === project.creador_id) : null;
  const ownerCompany = creator ? companies.find(c => c.id === creator.empresa_id) : null;

  // ── PROJECT MEMBERS — loaded directly from API (includes cross-company members) ──
  const [projectMembers, setProjectMembers] = useState<Array<{
    id: number;
    nombre_completo: string;
    correo: string;
    cargo?: string;
    empresa_id?: number;
  }>>([]);

  // Fallback: if API not yet loaded, derive from context
  const participatingUsers = projectMembers.length > 0
    ? projectMembers
    : (project?.participantes
      ? users.filter(u => project.participantes!.some(p => p.usuario_id === u.id))
      : []);

  const projectMessages = chatMessages;
  const projectTasks = localTasks;
  const projectResources = project?.recursos || [];

  const pendingJoinRequests = projectJoinRequests.filter(r => r.estado === 'pendiente');

  // Get Recursos folder
  const recursosFolder = projectResources.find(r => r.nombre === 'Recursos' && r.tipo === 'carpeta' && !r.padre_id);

  // If no folder selected, default to Recursos folder
  const activeFolderId = currentFolderId !== undefined ? currentFolderId : recursosFolder?.id;

  // Initialize resources folder when project loads
  useEffect(() => {
    if (recursosFolder && currentFolderId === undefined) {
      setCurrentFolderId(recursosFolder.id);
    }
  }, [recursosFolder?.id]);

  // ── CHAT: load messages from API + poll every 3s ────────────────────
  const fetchChatMessages = async () => {
    if (!project) return;
    try {
      const data = await api.get<any[]>(`/chats/proyecto/${project.id}/mensajes`);
      setChatMessages(Array.isArray(data) ? data : []);
    } catch { /* silently ignore polling errors */ }
  };

  useEffect(() => {
    if (!project?.id) return;
    fetchChatMessages();
    pollingRef.current = setInterval(fetchChatMessages, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [project?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);
  // ─────────────────────────────────────────────────────────────────


  const fetchProjectTasks = async (pId: number) => {
    try {
      const [colData, taskData] = await Promise.all([
        api.get<any[]>(`/tareas/columnas/proyecto/${pId}`),
        api.get<any[]>(`/tareas/proyecto/${pId}`),
      ]);
      setKanbanColumns(Array.isArray(colData) ? colData.map((c: any) => ({ id: c.id, nombre: c.nombre, orden: c.orden })) : []);
      setLocalTasks(Array.isArray(taskData) ? taskData : []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  useEffect(() => {
    if (!project?.id) return;
    setLoadingTasks(true);
    fetchProjectTasks(project.id).finally(() => setLoadingTasks(false));
  }, [project?.id]);

  // ── PROJECT DETAIL: trae recursos + members completos (incl. cross-company) ──
  useEffect(() => {
    setProjectCompleto(null);
    if (!id) return;
    api.get<Project>(`/proyectos/${id}`)
      .then(data => {
        setProjectCompleto(data);

        const members: any[] = [];
        // Add creator
        if (data.creador) {
          members.push(data.creador);
        } else if (creator) {
          members.push(creator);
        }
        // Add accepted participants (avoid duplicate if creator is also in participantes)
        if (Array.isArray(data.participantes)) {
          data.participantes.forEach((p: any) => {
            const u = p.usuario ?? p;
            if (u?.id && !members.some(m => m.id === u.id)) {
              members.push(u);
            }
          });
        }
        setProjectMembers(members);
      })
      .catch(() => { /* silently use context fallback */ });
  }, [id]);
  useEffect(() => {
    if (!project || !currentUser) return;
    if (currentUser.id !== project.creador_id) return;
    setLoadingRequests(true);
    api.get<any[]>(`/proyectos/${project.id}/solicitudes`)
      .then(data => setProjectJoinRequests(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingRequests(false));
  }, [project?.id, currentUser?.id]);

  const handleAcceptJoinRequest = async (solicitudId: number) => {
    await api.patch(`/proyectos/solicitudes/${solicitudId}/aceptar`, {});
    setProjectJoinRequests(prev => prev.map(r => r.id === solicitudId ? { ...r, estado: 'aceptado' } : r));
  };

  const handleRejectJoinRequest = async (solicitudId: number) => {
    await api.patch(`/proyectos/solicitudes/${solicitudId}/rechazar`, {});
    setProjectJoinRequests(prev => prev.map(r => r.id === solicitudId ? { ...r, estado: 'rechazado' } : r));
  };

  // Sync editingTask with projectsTasks to show new comments immediately
  const latestEditingTask = editingTask ? projectTasks.find(t => t.id === editingTask.id) : null;
  const currentEditingTask = latestEditingTask || editingTask;

  const isOwner = currentUser?.id === project?.creador_id;
  const isParticipant = project?.participantes?.some(p => p.usuario_id === currentUser?.id) || isOwner;
  // 'miembro' es un colaborador al que el creador le dio acceso para crear tareas
  // (sin darle el rol completo de 'admin', reservado para el dueño del proyecto).
  const miParticipacion = project?.participantes?.find(p => p.usuario_id === currentUser?.id);
  const puedeCrearTareas = isOwner || miParticipacion?.rol === 'miembro';
  // El Administrador de Empresa puede editar foto/descripción/fecha fin, pero solo en
  // proyectos donde ya tiene acceso al workspace (es creador o participante).
  const puedeEditarInfo = isParticipant && currentUser?.rol === 'admin';

  if (!project) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Proyecto no encontrado</h1>
          <Link to="/dashboard">
            <Button variant="primary">Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No tienes acceso a este grupo de trabajo</h1>
          <Link to="/dashboard">
            <Button variant="primary">Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || sendingMsg) return;
    const text = messageText.trim();
    setMessageText('');
    setSendingMsg(true);

    // Optimistic UI: add message immediately
    const optimistic = {
      id: Date.now(),
      chat_id: -1,
      usuario_id: currentUser!.id,
      contenido: text,
      fecha: new Date().toISOString(),
      usuario: { nombre_completo: currentUser!.nombre_completo },
    };
    setChatMessages(prev => [...prev, optimistic]);

    try {
      const saved = await api.post<any>(`/chats/proyecto/${project.id}/mensajes`, { contenido: text });
      // Replace optimistic with real message
      setChatMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
    } catch {
      // On error restore the text
      setMessageText(text);
      setChatMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSendingMsg(false);
    }
  };

  const apiCall = async (url: string, method = 'GET', body?: any) => {
    if (method === 'GET') return api.get<any>(url);
    if (method === 'POST') return api.post<any>(url, body);
    if (method === 'PATCH') return api.patch<any>(url, body);
    if (method === 'DELETE') return api.delete<any>(url);
    throw new Error(`Unsupported method ${method}`);
  };

  // ── Dar/quitar acceso a un colaborador para crear tareas ('miembro' ⇄ 'colaborador') ──
  const [updatingAccesoId, setUpdatingAccesoId] = useState<number | null>(null);
  const handleToggleAccesoTareas = async (usuarioId: number, rolActual: string) => {
    if (!project) return;
    const nuevoRol = rolActual === 'miembro' ? 'colaborador' : 'miembro';
    setUpdatingAccesoId(usuarioId);
    try {
      await api.patch(`/proyectos/${project.id}/participantes/${usuarioId}`, { rol: nuevoRol });
      setProjectCompleto(prev => {
        const base = prev ?? project;
        return {
          ...base,
          participantes: base.participantes?.map(p =>
            p.usuario_id === usuarioId ? { ...p, rol: nuevoRol } : p
          ),
        };
      });
      toast.success(nuevoRol === 'miembro' ? 'Ahora puede crear tareas en el proyecto' : 'Se quitó el acceso para crear tareas');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el acceso');
    } finally {
      setUpdatingAccesoId(null);
    }
  };

  // ── Edición de info del proyecto (Administrador de Empresa): foto, descripción, fecha fin ──
  const startEditingProjectInfo = () => {
    if (!project) return;
    setEditDescripcion(project.descripcion_completa || '');
    setEditFechaFin(project.fecha_fin ? project.fecha_fin.slice(0, 10) : '');
    setEditImagenes((project.imagenes || []).map(img => img.url));
    setEditingProjectInfo(true);
  };

  const handleProjectImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) { toast.error('Selecciona archivos de imagen válidos'); return; }
    setUploadingProjectImage(true);
    try {
      const uploaded = await Promise.all(imageFiles.map(f => uploadFile(f)));
      setEditImagenes(prev => [...prev, ...uploaded]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploadingProjectImage(false);
      if (projectImageInputRef.current) projectImageInputRef.current.value = '';
    }
  };

  const removeEditImage = (index: number) => setEditImagenes(prev => prev.filter((_, i) => i !== index));

  const handleSaveProjectInfo = async () => {
    if (!project) return;
    setSavingProjectInfo(true);
    try {
      const updated = await api.patch<Project>(`/proyectos/${project.id}`, {
        descripcion_completa: editDescripcion.trim(),
        fecha_fin: editFechaFin || null,
        imagenes_urls: editImagenes,
      });
      setProjectCompleto(updated);
      setEditingProjectInfo(false);
      toast.success('Información del proyecto actualizada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el proyecto');
    } finally {
      setSavingProjectInfo(false);
    }
  };

  const ensureColumns = async (pId: number): Promise<typeof kanbanColumns> => {
    if (kanbanColumns.length > 0) return kanbanColumns;
    // Create the default 3 columns if none exist
    const cols = [
      { nombre: 'Por Hacer', orden: 1 },
      { nombre: 'En Proceso', orden: 2 },
      { nombre: 'Completado', orden: 3 },
    ];
    const created = await Promise.all(cols.map(c => apiCall('/tareas/columnas', 'POST', { proyecto_id: pId, ...c })));
    setKanbanColumns(created);
    return created;
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const cols = await ensureColumns(project!.id);
      const firstCol = cols[0];
      const newTask = await apiCall('/tareas', 'POST', {
        proyecto_id: project!.id,
        titulo: newTaskTitle,
        descripcion: newTaskDesc,
        usuario_ids: newTaskAssignees,
        prioridad: newTaskPriority,
        fecha_limite: newTaskDeadline || null,
        columna_id: firstCol.id,
        orden: localTasks.filter(t => t.columna_id === firstCol.id).length,
      });
      setLocalTasks(prev => [...prev, newTask]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDeadline('');
      setNewTaskAssignees([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear la tarea');
    }
  };

  const handleMoveTask = async (taskId: number, newColId: number) => {
    if (isReadOnly) return;
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, columna_id: newColId } : t));
    await apiCall(`/tareas/${taskId}`, 'PATCH', { columna_id: newColId });
  };

  const handleOpenEditModal = (task: any) => {
    setEditingTask(task);
    setEditTaskTitle(task.titulo);
    setEditTaskDesc(task.descripcion || '');
    setEditTaskPriority(task.prioridad);
    setEditTaskDeadline(task.fecha_limite || '');
    // Initialize assignees from the ManyToMany relation
    setEditTaskAssignees((task.usuarios ?? []).map((u: any) => u.id));
  };

  const handleSaveEditTask = async () => {
    if (!editingTask) return;
    const updated = await apiCall(`/tareas/${editingTask.id}`, 'PATCH', {
      titulo: editTaskTitle,
      descripcion: editTaskDesc,
      prioridad: editTaskPriority,
      fecha_limite: editTaskDeadline || null,
      usuario_ids: editTaskAssignees,
    });
    setLocalTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
    setEditingTask(null);
  };

  const handleAddTaskComment = async () => {
    if (!editingTask || !newTaskComment.trim()) return;
    const newComment = await apiCall(`/tareas/${editingTask.id}/comentarios`, 'POST', { texto: newTaskComment });
    setLocalTasks(prev => prev.map(t =>
      t.id === editingTask.id
        ? { ...t, comentarios: [...(t.comentarios || []), newComment] }
        : t
    ));
    setEditingTask(prev => prev ? { ...prev, comentarios: [...(prev.comentarios || []), newComment] } : null);
    setNewTaskComment('');
  };

  const handleDeleteTask = async (taskId: number) => {
    setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    await apiCall(`/tareas/${taskId}`, 'DELETE');
    if (editingTask?.id === taskId) setEditingTask(null);
  };

  const currentResources = projectResources
    .filter(r => r.padre_id === activeFolderId)
    .sort((a, b) => {
      if (a.tipo === b.tipo) return 0;
      return a.tipo === 'carpeta' ? -1 : 1;
    });
  const currentPath = activeFolderId ? (() => {
    const path = [];
    let curr = projectResources.find(r => r.id === activeFolderId);
    while (curr) {
      path.unshift(curr);
      curr = projectResources.find(r => r.id === curr?.padre_id);
    }
    return path;
  })() : [];

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    addResource({
      proyecto_id: project.id,
      nombre: newFolderName,
      tipo: 'carpeta',
      padre_id: activeFolderId
    });
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be uploaded again if needed
    e.target.value = '';

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { base64, filename } = await api.post<any>('/recursos/upload', formData);

      await addResource({
        proyecto_id: project.id,
        nombre: filename || file.name,
        tipo: 'archivo',
        url: base64,
        padre_id: activeFolderId,
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo. Por favor intenta de nuevo.');
    } finally {
      setUploadingFile(false);
    }
  };

  const tabs = [
    { id: 'info' as TabType, label: 'Información', icon: Info },
    { id: 'team' as TabType, label: 'Equipo', icon: Users },
    { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare },
    { id: 'tasks' as TabType, label: 'Tareas', icon: ListTodo },
    { id: 'resources' as TabType, label: 'Recursos', icon: Folder },
    ...(isOwner ? [{ id: 'solicitudes' as TabType, label: 'Solicitudes', icon: UserPlus, badge: pendingJoinRequests.length }] : []),
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link to="/dashboard">
              <Button variant="ghost" className="mb-4 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </Button>
            </Link>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{project.nombre}</h1>
                <p className="text-muted-foreground">{ownerCompany?.nombre}</p>
              </div>
              <div className="flex items-center gap-3">
                {isOwner && pendingJoinRequests.length > 0 && (
                  <button
                    onClick={() => setActiveTab('solicitudes')}
                    className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning border border-warning/30 rounded-lg text-sm font-semibold hover:bg-warning/20 transition-colors animate-pulse"
                  >
                    <UserPlus className="w-4 h-4" />
                    {pendingJoinRequests.length} Solicitud{pendingJoinRequests.length > 1 ? 'es' : ''} Pendiente{pendingJoinRequests.length > 1 ? 's' : ''}
                  </button>
                )}
                {isOwner && (
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    Propietario
                  </div>
                )}
              </div>
            </div>
          </div>

          {project.suspendido && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertOctagon className="w-6 h-6 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive">Espacio de Trabajo Suspendido</h3>
                <p className="text-sm text-destructive/90">
                  Este proyecto se encuentra congelado temporalmente porque el acceso de su creador ha sido bloqueado.
                  Actualmente puedes navegar por el contenido en modo "solo lectura".
                </p>
              </div>
            </div>
          )}

          {project.estado === 'archivado' && (
            <div className="mb-6 p-4 bg-slate-100 border border-slate-300 rounded-lg flex items-start gap-3">
              <AlertOctagon className="w-6 h-6 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-700">Espacio de Trabajo Archivado</h3>
                <p className="text-sm text-slate-600">
                  Este proyecto ha sido archivado y no está visible al público general.
                  Actualmente puedes navegar por su contenido en modo "solo lectura".
                </p>
              </div>
            </div>
          )}

          {project.estado === 'terminado' && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-emerald-800">Espacio de Trabajo Terminado</h3>
                <p className="text-sm text-emerald-700">
                  Este proyecto ha sido finalizado con éxito.
                  Puedes seguir consultando todo su historial y recursos en modo "solo lectura".
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 border-b border-border">
            <div className="flex gap-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const hasBadge = 'badge' in tab && (tab as any).badge > 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors relative ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {hasBadge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-warning/15 text-warning rounded-full border border-warning/20">
                        {(tab as any).badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'info' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Edit toggle (Administrador de Empresa) */}
                {puedeEditarInfo && (
                  <div className="flex justify-end -mb-2">
                    {!editingProjectInfo ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startEditingProjectInfo}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar Información
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingProjectInfo(false)} disabled={savingProjectInfo}>
                          Cancelar
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSaveProjectInfo} disabled={savingProjectInfo} className="flex items-center gap-2">
                          {savingProjectInfo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Guardar Cambios
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Images */}
                <Card className="overflow-hidden">
                  {editingProjectInfo ? (
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Image className="w-4 h-4 text-primary" /> Imágenes del Proyecto
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => projectImageInputRef.current?.click()}
                          disabled={uploadingProjectImage}
                          className="flex items-center gap-2"
                        >
                          {uploadingProjectImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          Agregar
                        </Button>
                        <input
                          ref={projectImageInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleProjectImageSelect}
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {editImagenes.map((url, idx) => (
                          <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-border">
                            <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeEditImage(idx)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {editImagenes.length === 0 && (
                          <p className="text-sm text-muted-foreground col-span-full">Sin imágenes. Agrega al menos una.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-96">
                      <Slider {...sliderSettings}>
                        {project.imagenes.map((img, idx) => (
                          <div key={idx}>
                            <img
                              src={img.url}
                              alt={`${project.nombre} ${idx + 1}`}
                              className="w-full h-96 object-cover"
                            />
                          </div>
                        ))}
                      </Slider>
                    </div>
                  )}
                </Card>

                {/* Description */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Descripción</h3>
                  {editingProjectInfo ? (
                    <TextArea
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      placeholder="Descripción completa del proyecto..."
                      rows={6}
                    />
                  ) : (
                    <p className="text-muted-foreground whitespace-pre-line">
                      {project.descripcion_completa}
                    </p>
                  )}
                </Card>

                {/* Info Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Fechas</h4>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1.5">
                      <div>Inicio: {project.fecha_inicio}</div>
                      {editingProjectInfo ? (
                        <div className="flex items-center gap-2">
                          <span>Fin:</span>
                          <Input
                            type="date"
                            value={editFechaFin}
                            onChange={(e) => setEditFechaFin(e.target.value)}
                            className="h-8 text-sm w-40"
                          />
                        </div>
                      ) : (
                        <div>Fin: {project.fecha_fin}</div>
                      )}
                    </div>
                  </Card>

                  {project.financiamiento && (
                    <Card className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-success" />
                        <h4 className="font-semibold">Financiamiento</h4>
                      </div>
                      <div className="text-2xl font-bold text-success">
                        ${project.financiamiento.toLocaleString()}
                      </div>
                    </Card>
                  )}

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-accent" />
                      <h4 className="font-semibold">Colaboradores</h4>
                    </div>
                    <div className="text-2xl font-bold">
                      {participatingUsers.length}
                    </div>
                  </Card>
                </div>

                {/* End of Info Section */}
              </motion.div>
            )}

            {activeTab === 'team' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Usuarios Participantes</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {participatingUsers.map(user => {
                      const userComp = companies.find(c => c.id === user.empresa_id);
                      const esCreador = user.id === project.creador_id;
                      const rolEnProyecto = project.participantes?.find(p => p.usuario_id === user.id)?.rol;
                      const tieneAccesoTareas = rolEnProyecto === 'miembro';
                      return (
                        <Card key={user.id} className="p-4 bg-muted">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${esCreador ? 'bg-gradient-to-br from-primary to-purple-500' : 'bg-gradient-to-br from-accent to-success'
                              }`}>
                              {user.nombre_completo.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{user.nombre_completo}</h4>
                              {user.cargo && <p className="text-sm text-muted-foreground">{user.cargo}</p>}
                              {userComp && <p className="text-sm text-muted-foreground">{userComp.nombre}</p>}
                              {esCreador ? (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">Creador</span>
                              ) : tieneAccesoTareas && (
                                <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded mt-1 inline-block">Puede crear tareas</span>
                              )}
                            </div>
                            {isOwner && !esCreador && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingAccesoId === user.id}
                                onClick={() => handleToggleAccesoTareas(user.id, rolEnProyecto || 'colaborador')}
                              >
                                {updatingAccesoId === user.id
                                  ? '...'
                                  : tieneAccesoTareas ? 'Quitar acceso' : 'Dar acceso a tareas'}
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col h-[600px] bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

                  {/* Chat Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{project.nombre}</p>
                        <p className="text-xs text-muted-foreground">{participatingUsers.length} participante{participatingUsers.length !== 1 ? 's' : ''} · Chat del proyecto</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        En vivo
                      </span>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {projectMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                          <MessageSquare className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-muted-foreground">No hay mensajes aún</p>
                        <p className="text-sm text-muted-foreground/70">¡Sé el primero en iniciar la conversación!</p>
                      </div>
                    ) : (
                      projectMessages.map((message, idx) => {
                        const isOwn = message.usuario_id === currentUser?.id;
                        const sender = message.usuario?.nombre_completo ||
                          users.find(u => u.id === message.usuario_id)?.nombre_completo || 'Usuario';
                        const senderInitial = sender.charAt(0).toUpperCase();
                        // Show avatar only when sender changes
                        const prevMsg = projectMessages[idx - 1];
                        const showHeader = !prevMsg || prevMsg.usuario_id !== message.usuario_id;
                        const dateLabel = new Date(message.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <div key={message.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className="flex flex-col justify-end flex-shrink-0">
                              {showHeader ? (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm ${isOwn ? 'bg-gradient-to-br from-primary to-purple-500' : 'bg-gradient-to-br from-accent to-success'
                                  }`}>
                                  {senderInitial}
                                </div>
                              ) : <div className="w-8" />}
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                              {showHeader && (
                                <p className={`text-[11px] font-semibold text-muted-foreground mb-1 ${isOwn ? 'text-right' : ''}`}>
                                  {isOwn ? 'Tú' : sender}
                                </p>
                              )}
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isOwn
                                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-sm'
                                : 'bg-muted text-foreground rounded-tl-sm border border-border/50'
                                }`}>
                                {message.contenido}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1 px-1">{dateLabel}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="px-4 py-3 border-t border-border bg-muted/20">
                    <div className="flex items-center gap-2 bg-background border border-border rounded-2xl px-4 py-2 shadow-sm focus-within:border-primary transition-colors">
                      <Input
                        placeholder={isReadOnly ? "El chat está deshabilitado en proyectos suspendidos, archivados o terminados" : "Escribe un mensaje..."}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        className="flex-1 border-none bg-transparent shadow-none focus:ring-0 px-0 py-0 text-sm"
                        disabled={sendingMsg || isReadOnly}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendingMsg || isReadOnly}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${messageText.trim() && !sendingMsg && !isReadOnly
                          ? 'bg-primary text-primary-foreground shadow-md hover:scale-105 cursor-pointer'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                          }`}
                      >
                        {sendingMsg
                          ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-1.5">Enter para enviar · Se actualiza cada 3 segundos</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                {/* Create Task (Owner or granted 'miembro' only) */}
                {puedeCrearTareas && !isReadOnly && (
                  <Card className="p-6 mb-6 border-none shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" /> Nueva Tarea
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <Input
                        placeholder="Título de la tarea *"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                      />
                      <Input
                        placeholder="Descripción (opcional)"
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                      />
                    </div>
                    {/* Row 2: priority + date */}
                    <div className="flex flex-wrap gap-3 items-center mb-4">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="px-3 py-2 bg-input-background border border-input rounded-lg text-sm"
                      >
                        <option value="baja">🟢 Prioridad Baja</option>
                        <option value="media">🟡 Prioridad Media</option>
                        <option value="alta">🔴 Prioridad Alta</option>
                      </select>
                      <Input
                        type="date"
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        className="w-44"
                      />
                    </div>
                    {/* Row 3: assignee selector + create button */}
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <AssigneeSelector
                          participants={participatingUsers}
                          selected={newTaskAssignees}
                          onChange={setNewTaskAssignees}
                          compact
                        />
                      </div>
                      <Button
                        variant="primary"
                        onClick={handleCreateTask}
                        className="flex items-center gap-2 flex-shrink-0 self-end"
                      >
                        <Plus className="w-4 h-4" /> Crear Tarea
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Loading */}
                {loadingTasks ? (
                  <Card className="p-16 text-center border-none shadow-sm">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Cargando tablero...</p>
                  </Card>
                ) : kanbanColumns.length === 0 && !puedeCrearTareas ? (
                  <Card className="p-16 text-center border-none shadow-sm">
                    <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-semibold text-muted-foreground">No hay tareas aún</p>
                    <p className="text-sm text-muted-foreground/70">El propietario del proyecto o un miembro con acceso puede crear tareas desde este tablero</p>
                  </Card>
                ) : (
                  /* Kanban Board — Dynamic columns from DB */
                  <div className="flex gap-4 overflow-x-auto pb-6">
                    {kanbanColumns.map(col => (
                      <TaskColumn
                        key={col.id}
                        title={col.nombre}
                        columna_id={col.id}
                        tasks={projectTasks.filter(t => t.columna_id === col.id)}
                        onDrop={handleMoveTask}
                        onEditTask={handleOpenEditModal}
                      />
                    ))}
                    {/* If no columns yet and can create tasks, show placeholder */}
                    {kanbanColumns.length === 0 && puedeCrearTareas && (
                      <div className="flex-1 text-center py-16 text-muted-foreground">
                        <ListTodo className="w-10 h-10 mx-auto mb-3" />
                        <p className="text-sm">Crea tu primera tarea y se inicializará el tablero automáticamente</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

            )}

            {activeTab === 'resources' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />

                <Card className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentFolderId(undefined)}
                        className={!currentFolderId && activeFolderId === recursosFolder?.id ? 'text-primary font-bold' : 'text-muted-foreground'}
                      >
                        Raíz
                      </Button>
                      {currentPath.map(folder => (
                        <div key={folder.id} className="flex items-center gap-1">
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentFolderId(folder.id)}
                            className={activeFolderId === folder.id ? 'text-primary font-bold' : 'text-muted-foreground'}
                          >
                            {folder.nombre}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    {!isReadOnly && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewFolderModal(true)}
                          className="flex items-center gap-2"
                        >
                          <FolderPlus className="w-4 h-4" />
                          Carpeta
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleUploadFile}
                          disabled={uploadingFile}
                          className="flex items-center gap-2 min-w-[90px]"
                        >
                          {uploadingFile ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Subir
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Upload hint */}
                  <p className="text-xs text-muted-foreground mb-4">Acepta PDFs e imágenes (JPG, PNG, GIF, WebP…)</p>

                  {/* File/folder grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {currentResources.map(res => {
                      const isPdf = res.url?.startsWith('data:application/pdf');
                      const isImage = res.url?.startsWith('data:image/');
                      return (
                        <motion.div
                          key={res.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="group relative"
                        >
                          <Card
                            className={`p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-all h-32 ${res.tipo === 'carpeta' ? 'bg-muted/60' : 'bg-card'
                              }`}
                            onClick={() => {
                              if (res.tipo === 'carpeta') {
                                setCurrentFolderId(res.id);
                              } else if (res.tipo === 'archivo' && res.url) {
                                openBase64(res.url);
                              }
                            }}
                          >
                            {res.tipo === 'carpeta' ? (
                              <Folder className="w-10 h-10 text-primary mb-2" />
                            ) : isPdf ? (
                              <div className="relative mb-2">
                                <FileText className="w-10 h-10 text-destructive" />
                                <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-destructive text-white px-1 rounded">PDF</span>
                              </div>
                            ) : isImage ? (
                              <div className="relative mb-2">
                                <Image className="w-10 h-10 text-accent" />
                                <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-accent text-white px-1 rounded">IMG</span>
                              </div>
                            ) : (
                              <FileText className="w-10 h-10 text-muted-foreground mb-2" />
                            )}
                            <span className="text-xs font-medium truncate w-full px-2 leading-tight" title={res.nombre}>
                              {res.nombre}
                            </span>
                          </Card>
                          {!isReadOnly && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`¿Eliminar ${res.nombre}?`)) deleteResource(res.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-destructive/10 text-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}

                    {/* Upload drop zone placeholder when empty */}
                    {uploadingFile && (
                      <div className="h-32 border-2 border-dashed border-primary/40 rounded-xl flex flex-col items-center justify-center gap-2 animate-pulse">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-xs text-primary font-medium">Subiendo...</span>
                      </div>
                    )}
                  </div>

                  {currentResources.length === 0 && !uploadingFile && (
                    <div
                      className="text-center py-20 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
                      onClick={handleUploadFile}
                    >
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground font-medium">Esta carpeta está vacía</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Haz clic para subir un archivo o usa el botón «Subir»</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ── SOLICITUDES TAB (owner only) ── */}
            {activeTab === 'solicitudes' && isOwner && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Solicitudes de Participación</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Gestiona quién se une a <strong>{project.nombre}</strong></p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-sm px-3 py-1.5 bg-warning/10 text-warning rounded-full border border-warning/20 font-semibold">
                      {pendingJoinRequests.length} pendiente{pendingJoinRequests.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm px-3 py-1.5 bg-success/10 text-success rounded-full border border-success/20 font-semibold">
                      {projectJoinRequests.filter(r => r.estado === 'aceptado').length} aceptadas
                    </span>
                  </div>
                </div>

                {loadingRequests ? (
                  <Card className="p-12 text-center border-none shadow-sm">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Cargando solicitudes...</p>
                  </Card>
                ) : pendingJoinRequests.length > 0 ? (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Pendientes de revisión
                    </h3>
                    {pendingJoinRequests.map((req, i) => {
                      const reqCompany = req.usuario?.empresa_id
                        ? companies.find(c => c.id === req.usuario!.empresa_id)
                        : null;
                      return (
                        <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                          <Card className="p-0 border-none shadow-sm overflow-hidden relative hover:shadow-md transition-all">
                            <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
                            <div className="p-6 pl-7">
                              <div className="flex items-start gap-5 justify-between">
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
                                    {req.usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-bold text-lg">{req.usuario?.nombre_completo}</p>
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-warning/10 text-warning rounded-full border border-warning/20 uppercase">Pendiente</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                      <Mail className="w-3.5 h-3.5" />{req.usuario?.correo}
                                    </div>
                                    {req.usuario?.cargo && (
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{req.usuario.cargo}</span>
                                      </div>
                                    )}
                                    {reqCompany && (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{reqCompany.nombre}</span>
                                      </div>
                                    )}
                                    {req.mensaje && (
                                      <div className="mt-3 p-3 bg-muted/60 rounded-xl border border-border/50 text-sm italic text-muted-foreground">
                                        "{req.mensaje}"
                                      </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {new Date(req.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                                {!project.suspendido && (
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    <Button
                                      variant="success"
                                      size="sm"
                                      className="flex items-center gap-1.5 text-xs font-bold shadow-sm shadow-success/20 hover:scale-[1.02] transition-all"
                                      onClick={() => handleAcceptJoinRequest(req.id)}
                                    >
                                      <UserCheck className="w-3.5 h-3.5" /> ACEPTAR
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1.5 text-xs text-destructive border-destructive hover:bg-destructive/10"
                                      onClick={() => handleRejectJoinRequest(req.id)}
                                    >
                                      <UserX className="w-3.5 h-3.5" /> Rechazar
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-16 text-center border-none shadow-sm mb-8">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Sin solicitudes pendientes</h3>
                    <p className="text-muted-foreground text-sm">Cuando alguien quiera unirse al proyecto aparecerá aquí.</p>
                  </Card>
                )}

                {/* Processed requests */}
                {projectJoinRequests.filter(r => r.estado !== 'pendiente').length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Procesadas</h3>
                    <div className="space-y-2">
                      {projectJoinRequests.filter(r => r.estado !== 'pendiente').map(req => (
                        <Card key={req.id} className={`p-4 border-none shadow-sm ${req.estado === 'rechazado' ? 'opacity-50' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${req.estado === 'aceptado' ? 'bg-gradient-to-br from-success to-emerald-600' : 'bg-muted'
                                }`}>
                                {req.usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{req.usuario?.nombre_completo}</p>
                                <p className="text-xs text-muted-foreground">{req.usuario?.correo}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${req.estado === 'aceptado'
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                              }`}>
                              {req.estado === 'aceptado' ? 'Aceptada' : 'Rechazada'}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Task Edit Modal */}
        {currentEditingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg"
            >
              <Card className="p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                <button
                  onClick={() => setEditingTask(null)}
                  className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-2xl font-bold mb-6">Detalles de la Tarea</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Título</label>
                    <Input
                      value={editTaskTitle}
                      onChange={(e) => setEditTaskTitle(e.target.value)}
                      placeholder="Nombre de la tarea"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Descripción</label>
                    <TextArea
                      value={editTaskDesc}
                      onChange={(e) => setEditTaskDesc(e.target.value)}
                      placeholder="Añade detalles sobre lo que hay que hacer..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Prioridad</label>
                      <select
                        value={editTaskPriority}
                        onChange={(e) => setEditTaskPriority(e.target.value as any)}
                        className="w-full px-4 py-2 bg-input-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Fecha Límite</label>
                      <Input
                        type="date"
                        value={editTaskDeadline}
                        onChange={(e) => setEditTaskDeadline(e.target.value)}
                        disabled={project.suspendido}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <AssigneeSelector
                      participants={participatingUsers}
                      selected={editTaskAssignees}
                      onChange={setEditTaskAssignees}
                    />
                  </div>
                </div>

                {/* Task Comments Section */}
                <div className="mt-8 border-t pt-6">
                  <h4 className="text-sm font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comentarios y Actividad
                  </h4>

                  <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                    {currentEditingTask.comentarios && currentEditingTask.comentarios.length > 0 ? (
                      currentEditingTask.comentarios.map(comment => {
                        const commenter = users.find(u => u.id === comment.usuario_id);
                        return (
                          <div key={comment.id} className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {commenter?.nombre_completo?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold">{commenter?.nombre_completo}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(comment.fecha_creacion).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-balance">{comment.texto}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm italic">
                        No hay comentarios aún. ¡Sé el primero en comentar!
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Añadir un comentario..."
                      value={newTaskComment}
                      onChange={(e) => setNewTaskComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTaskComment()}
                      className="flex-1 h-9 text-sm"
                      disabled={project.suspendido}
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleAddTaskComment}
                      disabled={!newTaskComment.trim() || project.suspendido}
                    >
                      Comentar
                    </Button>
                  </div>
                </div>

                {!project.suspendido && (
                  <div className="flex justify-between items-center mt-8 pt-4 border-t">
                    <Button
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteTask(currentEditingTask.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setEditingTask(null)}>Cancelar</Button>
                      <Button variant="primary" onClick={handleSaveEditTask}>Guardar Cambios</Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        )}

        {/* New Folder Modal */}
        {showNewFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-sm p-6">
              <h3 className="text-lg font-bold mb-4">Nueva Carpeta</h3>
              <Input
                autoFocus
                placeholder="Nombre de la carpeta"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddFolder()}
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowNewFolderModal(false)}>Cancelar</Button>
                <Button variant="primary" onClick={handleAddFolder}>Crear</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
