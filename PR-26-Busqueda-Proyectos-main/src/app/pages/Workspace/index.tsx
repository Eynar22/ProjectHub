import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { proyectosService, solicitudesService, type Project } from '@/features/proyectos';
import {
  tareasService,
  chatService,
  recursosService,
  useCrearRecurso,
  useEliminarRecurso,
  useSubirArchivo,
} from '@/features/workspace';
import { Navbar } from '../../components/Navbar';
import { Button } from '../../components/Button';
import {
  ArrowLeft,
  Info,
  Users,
  MessageSquare,
  ListTodo,
  Folder,
  UserPlus,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { ProyectoSolicitud, TabType } from './types';
import { InfoTab } from './InfoTab';
import { TeamTab } from './TeamTab';
import { ChatTab } from './ChatTab';
import { TasksTab } from './TasksTab';
import { ResourcesTab } from './ResourcesTab';
import { SolicitudesTab } from './SolicitudesTab';
import { TaskEditModal } from './TaskEditModal';
import { NewFolderModal } from './NewFolderModal';

export default function Workspace() {
  const { id } = useParams();
  const { projects, archivedProjects, companies, users, currentUser, openBase64 } = useApp();
  const crearRecurso = useCrearRecurso();
  const eliminarRecursoMut = useEliminarRecurso();
  const subir = useSubirArchivo();
  const uploadFile = async (file: File) => (await subir.mutateAsync(file)).base64;

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
      const data = await chatService.listarMensajes(project.id);
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
        tareasService.listarColumnas(pId),
        tareasService.listarPorProyecto(pId),
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
  const cargarProyectoDetalle = async () => {
    if (!id) return;
    try {
      const data = await proyectosService.obtenerPorId(id);
      setProjectCompleto(data);

      const members: any[] = [];
      if (data.creador) {
        members.push(data.creador);
      } else if (creator) {
        members.push(creator);
      }
      if (Array.isArray(data.participantes)) {
        data.participantes.forEach((p: any) => {
          const u = p.usuario ?? p;
          if (u?.id && !members.some(m => m.id === u.id)) {
            members.push(u);
          }
        });
      }
      setProjectMembers(members);
    } catch {
      /* silently use context fallback */
    }
  };

  useEffect(() => {
    setProjectCompleto(null);
    cargarProyectoDetalle();
  }, [id]);

  useEffect(() => {
    if (!project || !currentUser) return;
    if (currentUser.id !== project.creador_id) return;
    setLoadingRequests(true);
    solicitudesService.listarPorProyecto(project.id)
      .then(data => setProjectJoinRequests(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingRequests(false));
  }, [project?.id, currentUser?.id]);

  const handleAcceptJoinRequest = async (solicitudId: number) => {
    await solicitudesService.aceptar(solicitudId);
    setProjectJoinRequests(prev => prev.map(r => r.id === solicitudId ? { ...r, estado: 'aceptado' } : r));
  };

  const handleRejectJoinRequest = async (solicitudId: number) => {
    await solicitudesService.rechazar(solicitudId);
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
      const saved = await chatService.enviarMensaje(project.id, text);
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

  // ── Dar/quitar acceso a un colaborador para crear tareas ('miembro' ⇄ 'colaborador') ──
  const [updatingAccesoId, setUpdatingAccesoId] = useState<number | null>(null);
  const handleToggleAccesoTareas = async (usuarioId: number, rolActual: string) => {
    if (!project) return;
    const nuevoRol = rolActual === 'miembro' ? 'colaborador' : 'miembro';
    setUpdatingAccesoId(usuarioId);
    try {
      await proyectosService.cambiarRolParticipante(project.id, usuarioId, nuevoRol);
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
      const updated = await proyectosService.actualizar(project.id, {
        descripcion_completa: editDescripcion.trim(),
        fecha_fin: editFechaFin || null,
        imagenes_urls: editImagenes,
      } as Partial<Project>);
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
    const created = await Promise.all(cols.map(c => tareasService.crearColumna({ proyecto_id: pId, ...c })));
    setKanbanColumns(created);
    return created;
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const cols = await ensureColumns(project!.id);
      const firstCol = cols[0];
      const newTask = await tareasService.crear({
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
    await tareasService.actualizar(taskId, { columna_id: newColId });
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
    const updated = await tareasService.actualizar(editingTask.id, {
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
    const newComment = await tareasService.agregarComentario(editingTask.id, newTaskComment);
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
    await tareasService.eliminar(taskId);
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

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    await crearRecurso.mutateAsync({
      proyecto_id: project.id,
      nombre: newFolderName,
      tipo: 'carpeta',
      padre_id: activeFolderId,
    });
    await cargarProyectoDetalle();
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
      const { base64, filename } = await recursosService.subirArchivo(file);
      await crearRecurso.mutateAsync({
        proyecto_id: project.id,
        nombre: filename || file.name,
        tipo: 'archivo',
        url: base64,
        padre_id: activeFolderId,
      });
      await cargarProyectoDetalle();
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo. Por favor intenta de nuevo.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    await eliminarRecursoMut.mutateAsync(resourceId);
    await cargarProyectoDetalle();
  };

  const tabs = [
    { id: 'info' as TabType, label: 'Información', icon: Info },
    { id: 'team' as TabType, label: 'Equipo', icon: Users },
    { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare },
    { id: 'tasks' as TabType, label: 'Tareas', icon: ListTodo },
    { id: 'resources' as TabType, label: 'Recursos', icon: Folder },
    ...(isOwner ? [{ id: 'solicitudes' as TabType, label: 'Solicitudes', icon: UserPlus, badge: pendingJoinRequests.length }] : []),
  ];

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
            <div className="mb-6 p-4 bg-muted border border-border rounded-lg flex items-start gap-3">
              <AlertOctagon className="w-6 h-6 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Espacio de Trabajo Archivado</h3>
                <p className="text-sm text-muted-foreground">
                  Este proyecto ha sido archivado y no está visible al público general.
                  Actualmente puedes navegar por su contenido en modo "solo lectura".
                </p>
              </div>
            </div>
          )}

          {project.estado === 'terminado' && (
            <div className="mb-6 p-4 bg-success-subtle border border-success/30 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-success-strong mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-success-strong">Espacio de Trabajo Terminado</h3>
                <p className="text-sm text-success-strong">
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
              <InfoTab
                project={project}
                puedeEditarInfo={puedeEditarInfo}
                editingProjectInfo={editingProjectInfo}
                setEditingProjectInfo={setEditingProjectInfo}
                startEditingProjectInfo={startEditingProjectInfo}
                savingProjectInfo={savingProjectInfo}
                handleSaveProjectInfo={handleSaveProjectInfo}
                editDescripcion={editDescripcion}
                setEditDescripcion={setEditDescripcion}
                editFechaFin={editFechaFin}
                setEditFechaFin={setEditFechaFin}
                editImagenes={editImagenes}
                removeEditImage={removeEditImage}
                uploadingProjectImage={uploadingProjectImage}
                projectImageInputRef={projectImageInputRef}
                handleProjectImageSelect={handleProjectImageSelect}
                participantsCount={participatingUsers.length}
              />
            )}

            {activeTab === 'team' && (
              <TeamTab
                participatingUsers={participatingUsers}
                companies={companies}
                project={project}
                isOwner={isOwner}
                updatingAccesoId={updatingAccesoId}
                onToggleAcceso={handleToggleAccesoTareas}
              />
            )}

            {activeTab === 'chat' && (
              <ChatTab
                projectName={project.nombre}
                participantsCount={participatingUsers.length}
                messages={projectMessages}
                currentUser={currentUser}
                users={users}
                messagesEndRef={messagesEndRef}
                messageText={messageText}
                setMessageText={setMessageText}
                onSend={handleSendMessage}
                sending={sendingMsg}
                isReadOnly={isReadOnly}
              />
            )}

            {activeTab === 'tasks' && (
              <TasksTab
                puedeCrearTareas={puedeCrearTareas}
                isReadOnly={isReadOnly}
                newTaskTitle={newTaskTitle}
                setNewTaskTitle={setNewTaskTitle}
                newTaskDesc={newTaskDesc}
                setNewTaskDesc={setNewTaskDesc}
                newTaskPriority={newTaskPriority}
                setNewTaskPriority={setNewTaskPriority}
                newTaskDeadline={newTaskDeadline}
                setNewTaskDeadline={setNewTaskDeadline}
                participatingUsers={participatingUsers}
                newTaskAssignees={newTaskAssignees}
                setNewTaskAssignees={setNewTaskAssignees}
                handleCreateTask={handleCreateTask}
                loadingTasks={loadingTasks}
                kanbanColumns={kanbanColumns}
                projectTasks={projectTasks}
                onMoveTask={handleMoveTask}
                onEditTask={handleOpenEditModal}
              />
            )}

            {activeTab === 'resources' && (
              <ResourcesTab
                fileInputRef={fileInputRef}
                onFileSelected={handleFileSelected}
                currentFolderId={currentFolderId}
                setCurrentFolderId={setCurrentFolderId}
                activeFolderId={activeFolderId}
                recursosFolderId={recursosFolder?.id}
                currentPath={currentPath}
                isReadOnly={isReadOnly}
                onNewFolderClick={() => setShowNewFolderModal(true)}
                onUploadClick={handleUploadFile}
                uploadingFile={uploadingFile}
                currentResources={currentResources}
                openBase64={openBase64}
                deleteResource={handleDeleteResource}
              />
            )}

            {/* ── SOLICITUDES TAB (owner only) ── */}
            {activeTab === 'solicitudes' && isOwner && (
              <SolicitudesTab
                projectName={project.nombre}
                pendingJoinRequests={pendingJoinRequests}
                loadingRequests={loadingRequests}
                allRequests={projectJoinRequests}
                companies={companies}
                suspended={!!project.suspendido}
                onAccept={handleAcceptJoinRequest}
                onReject={handleRejectJoinRequest}
              />
            )}
          </div>
        </div>

        {/* Task Edit Modal */}
        {currentEditingTask && (
          <TaskEditModal
            task={currentEditingTask}
            onClose={() => setEditingTask(null)}
            editTaskTitle={editTaskTitle}
            setEditTaskTitle={setEditTaskTitle}
            editTaskDesc={editTaskDesc}
            setEditTaskDesc={setEditTaskDesc}
            editTaskPriority={editTaskPriority}
            setEditTaskPriority={setEditTaskPriority}
            editTaskDeadline={editTaskDeadline}
            setEditTaskDeadline={setEditTaskDeadline}
            suspended={!!project.suspendido}
            participatingUsers={participatingUsers}
            editTaskAssignees={editTaskAssignees}
            setEditTaskAssignees={setEditTaskAssignees}
            users={users}
            newTaskComment={newTaskComment}
            setNewTaskComment={setNewTaskComment}
            onAddComment={handleAddTaskComment}
            onDelete={handleDeleteTask}
            onSave={handleSaveEditTask}
          />
        )}

        {/* New Folder Modal */}
        {showNewFolderModal && (
          <NewFolderModal
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            onClose={() => setShowNewFolderModal(false)}
            onCreate={handleAddFolder}
          />
        )}
      </div>
    </DndProvider>
  );
}
