import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { useApp } from '@/app/context/AppContext';
import {
  proyectosService,
  type Project,
  useProyecto,
  PROYECTOS_KEYS,
  useSolicitudesDeProyecto,
  useResponderSolicitud,
} from '@/features/proyectos';
import {
  tareasService,
  recursosService,
  useCrearRecurso,
  useEliminarRecurso,
  useSubirArchivo,
  useMensajesChat,
  useEnviarMensaje,
  useColumnasProyecto,
  useTareasProyecto,
  useCrearTarea,
  useActualizarTarea,
  useEliminarTarea,
  useAgregarComentario,
  TAREAS_KEYS,
} from '@/features/workspace';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/shared/components/layout/Navbar';
import { Button } from '@/shared/components/ui/Button';
import { useDocumentTitle } from '@/shared/utils/useDocumentTitle';
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
import type { TabType, WorkspaceMember, WorkspaceTask } from '@/features/workspace/components/types';
import { InfoTab } from '@/features/workspace/components/InfoTab';
import { TeamTab } from '@/features/workspace/components/TeamTab';
import { ChatTab } from '@/features/workspace/components/ChatTab';
import { TasksTab } from '@/features/workspace/components/TasksTab';
import { ResourcesTab } from '@/features/workspace/components/ResourcesTab';
import { SolicitudesTab } from '@/features/workspace/components/SolicitudesTab';
import { TaskEditModal } from '@/features/workspace/components/TaskEditModal';
import { NewFolderModal } from '@/features/workspace/components/NewFolderModal';

export default function Workspace() {
  const { id } = useParams();
  const { projects, archivedProjects, companies, users, currentUser, openBase64 } = useApp();
  const queryClient = useQueryClient();
  const crearRecurso = useCrearRecurso();
  const eliminarRecursoMut = useEliminarRecurso();
  const subir = useSubirArchivo();
  const uploadFile = async (file: File) => (await subir.mutateAsync(file)).base64;

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [messageText, setMessageText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'baja' | 'media' | 'alta'>('media');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskAssignees, setNewTaskAssignees] = useState<number[]>([]);

  // Task Editing Modal State
  const [editingTask, setEditingTask] = useState<WorkspaceTask | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<'baja' | 'media' | 'alta'>('media');
  const [editTaskDeadline, setEditTaskDeadline] = useState('');
  const [editTaskAssignees, setEditTaskAssignees] = useState<number[]>([]);
  const [newTaskComment, setNewTaskComment] = useState('');

  // Resources State
  const [updatingAccesoId, setUpdatingAccesoId] = useState<number | null>(null);
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
  const { data: projectCompleto } = useProyecto(id);
  const project = projectCompleto ?? projectLigero;
  useDocumentTitle(project?.nombre);

  const isReadOnly = project ? (project.suspendido || project.estado === 'archivado' || project.estado === 'terminado') : false;
  const creator = project ? users.find(u => u.id === project.creador_id) : null;
  const ownerCompany = creator ? companies.find(c => c.id === creator.empresa_id) : null;

  // ── PROJECT MEMBERS — derivado del detalle del proyecto (incluye cross-company) ──
  const projectMembers = useMemo<WorkspaceMember[]>(() => {
    if (!project) return [];
    const members: WorkspaceMember[] = [];
    if (project.creador) {
      members.push(project.creador);
    } else if (creator) {
      members.push(creator);
    }
    if (Array.isArray(project.participantes)) {
      project.participantes.forEach((p) => {
        // Defensivo: si el backend algún día devuelve el participante sin el
        // sub-objeto `usuario`, se descarta (u.id quedará undefined) en vez
        // de romper el render.
        const u = (p.usuario ?? p) as WorkspaceMember;
        if (u?.id && !members.some(m => m.id === u.id)) {
          members.push(u);
        }
      });
    }
    return members;
  }, [project, creator]);

  // Fallback: if API not yet loaded, derive from context
  const participatingUsers = projectMembers.length > 0
    ? projectMembers
    : (project?.participantes
      ? users.filter(u => project.participantes!.some(p => p.usuario_id === u.id))
      : []);

  const projectResources = project?.recursos || [];

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

  // ── CHAT: react-query, re-descarga cada 3s (se pausa con la pestaña oculta) ──
  // El auto-scroll al final vive dentro de ChatTab (necesita saber si el
  // usuario está scrolleado hacia arriba leyendo historial, para no sacarlo
  // de ahí cuando llega un mensaje nuevo).
  const { data: chatMessages = [] } = useMensajesChat(project?.id);
  const enviarMensaje = useEnviarMensaje(project?.id ?? '');
  // Se desestructura en vez de depender del objeto `enviarMensaje` entero:
  // `mutateAsync` es estable entre renders (lo garantiza react-query), así
  // `handleSendMessage` no cambia de identidad en renders ajenos al chat
  // (p. ej. el poll de tareas) y ChatTab (memoizado) puede saltarse esos
  // re-renders innecesarios.
  const { mutateAsync: enviarMensajeAsync, isPending: enviandoMensaje } = enviarMensaje;
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || enviandoMensaje) return;
    const text = messageText.trim();
    setMessageText('');
    try {
      await enviarMensajeAsync({ contenido: text });
    } catch {
      // On error restore the text
      setMessageText(text);
    }
  }, [messageText, enviandoMensaje, enviarMensajeAsync]);
  // ─────────────────────────────────────────────────────────────────


  // ── TAREAS: react-query. Columnas y lista de tareas del tablero kanban ──
  const { data: kanbanColumns = [], isLoading: loadingColumnas } = useColumnasProyecto(project?.id);
  const { data: projectTasks = [], isLoading: loadingListaTareas } = useTareasProyecto(project?.id);
  const loadingTasks = loadingColumnas || loadingListaTareas;
  const crearTarea = useCrearTarea(project?.id ?? '');
  const actualizarTarea = useActualizarTarea(project?.id ?? '');
  const eliminarTarea = useEliminarTarea(project?.id ?? '');
  const agregarComentario = useAgregarComentario(project?.id ?? '');
  // ─────────────────────────────────────────────────────────────────

  // ── SOLICITUDES DE UNIÓN: solo se piden si el usuario actual es el dueño ──
  const esDueno = !!currentUser && !!project && currentUser.id === project.creador_id;
  const { data: projectJoinRequests = [], isLoading: loadingRequests } =
    useSolicitudesDeProyecto(esDueno ? project?.id : undefined);
  const responderSolicitud = useResponderSolicitud();

  const handleAcceptJoinRequest = async (solicitudId: number) => {
    await responderSolicitud.mutateAsync({ solicitudId, accion: 'aceptar' });
  };

  const handleRejectJoinRequest = async (solicitudId: number) => {
    await responderSolicitud.mutateAsync({ solicitudId, accion: 'rechazar' });
  };

  const pendingJoinRequests = projectJoinRequests.filter(r => r.estado === 'pendiente');

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

  // ── Dar/quitar acceso a un colaborador para crear tareas ('miembro' ⇄ 'colaborador') ──
  const handleToggleAccesoTareas = async (usuarioId: number, rolActual: string) => {
    if (!project) return;
    const nuevoRol = rolActual === 'miembro' ? 'colaborador' : 'miembro';
    setUpdatingAccesoId(usuarioId);
    try {
      await proyectosService.cambiarRolParticipante(project.id, usuarioId, nuevoRol);
      queryClient.setQueryData(PROYECTOS_KEYS.detalle(project.id), (base: Project | undefined) => {
        if (!base) return base;
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
      queryClient.setQueryData(PROYECTOS_KEYS.detalle(project.id), updated);
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
    queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.columnas(pId) });
    return created;
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const cols = await ensureColumns(project!.id);
      const firstCol = cols[0];
      await crearTarea.mutateAsync({
        proyecto_id: project!.id,
        titulo: newTaskTitle,
        descripcion: newTaskDesc,
        usuario_ids: newTaskAssignees,
        prioridad: newTaskPriority,
        fecha_limite: newTaskDeadline || null,
        columna_id: firstCol.id,
        orden: projectTasks.filter(t => t.columna_id === firstCol.id).length,
      });
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDeadline('');
      setNewTaskAssignees([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear la tarea');
    }
  };

  const handleMoveTask = async (taskId: number, newColId: number) => {
    if (isReadOnly || !project) return;
    // Update optimista: la tarjeta se ve en la columna nueva de inmediato, sin
    // esperar el round-trip (drag&drop se ve roto si no hay feedback instantáneo).
    queryClient.setQueryData<WorkspaceTask[]>(
      TAREAS_KEYS.lista(project.id),
      (old) => (old ?? []).map(t => t.id === taskId ? { ...t, columna_id: newColId } : t),
    );
    await actualizarTarea.mutateAsync({ id: taskId, datos: { columna_id: newColId } });
  };

  const handleOpenEditModal = (task: WorkspaceTask) => {
    setEditingTask(task);
    setEditTaskTitle(task.titulo);
    setEditTaskDesc(task.descripcion || '');
    setEditTaskPriority(task.prioridad);
    setEditTaskDeadline(task.fecha_limite || '');
    // Initialize assignees from the ManyToMany relation
    setEditTaskAssignees((task.usuarios ?? []).map((u) => u.id));
  };

  const handleSaveEditTask = async () => {
    if (!editingTask) return;
    await actualizarTarea.mutateAsync({
      id: editingTask.id,
      datos: {
        titulo: editTaskTitle,
        descripcion: editTaskDesc,
        prioridad: editTaskPriority,
        fecha_limite: editTaskDeadline || null,
        usuario_ids: editTaskAssignees,
      },
    });
    setEditingTask(null);
  };

  const handleAddTaskComment = async () => {
    if (!editingTask || !newTaskComment.trim()) return;
    const newComment = await agregarComentario.mutateAsync({ tareaId: editingTask.id, texto: newTaskComment });
    // Patch local del modal para que el comentario se vea al instante, sin
    // esperar a que la invalidación de la query traiga la lista de nuevo.
    setEditingTask(prev => prev ? { ...prev, comentarios: [...(prev.comentarios || []), newComment] } : null);
    setNewTaskComment('');
  };

  const handleDeleteTask = async (taskId: number) => {
    await eliminarTarea.mutateAsync(taskId);
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
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo. Por favor intenta de nuevo.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    await eliminarRecursoMut.mutateAsync(resourceId);
  };

  const tabs = [
    { id: 'info' as TabType, label: 'Información', icon: Info, badge: 0 },
    { id: 'team' as TabType, label: 'Equipo', icon: Users, badge: 0 },
    { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare, badge: 0 },
    { id: 'tasks' as TabType, label: 'Tareas', icon: ListTodo, badge: 0 },
    { id: 'resources' as TabType, label: 'Recursos', icon: Folder, badge: 0 },
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
                const hasBadge = tab.badge > 0;
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
                        {tab.badge}
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
                messages={chatMessages}
                currentUser={currentUser}
                users={users}
                messageText={messageText}
                setMessageText={setMessageText}
                onSend={handleSendMessage}
                sending={enviandoMensaje}
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
