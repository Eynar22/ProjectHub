import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import { storage } from '@/lib/storage';
import { authService } from '@/features/auth';
import {
  proyectosService,
  solicitudesService,
  PROYECTOS_KEYS,
  SOLICITUDES_KEYS,
  useProyectos,
  useProyectosArchivados,
  useSolicitudesEnviadas,
} from '@/features/proyectos';

/* Los tipos del dominio viven ahora en /shared y /features (Anexo B7).
 * Se re-exportan aquí solo por compatibilidad con imports antiguos
 * (`import type { Project } from '../context/AppContext'`). Migrar esos
 * imports a los barriles de cada feature y luego eliminar este bloque. */
import type { User, UserRole } from '@/shared/types/user.types';
import type {
  Company,
  CompanyImagen,
  CompanyEnlace,
  CompanyRegistrant,
  MemberRequest,
} from '@/features/empresas/types/empresas.types';
import type {
  Project,
  Request,
  Resource,
} from '@/features/proyectos/types/proyectos.types';
import type { Task, TaskComment, Message } from '@/features/workspace/types/workspace.types';

export type {
  User,
  UserRole,
  Company,
  CompanyImagen,
  CompanyEnlace,
  CompanyRegistrant,
  MemberRequest,
  Project,
  Request,
  Resource,
  Task,
  TaskComment,
  Message,
};

interface AppContextType {
  currentUser: User | null;
  users: User[];
  companies: Company[];
  projects: Project[];
  archivedProjects: Project[];
  requests: Request[];
  messages: Message[];
  tasks: Task[];
  resources: Resource[];
  memberRequests: MemberRequest[];
  loading: boolean;
  login: (correo: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateCompany: (
    id: number,
    data: Partial<Company> & { imagenes_urls?: string[]; enlaces?: { url: string; nombre?: string }[] },
  ) => Promise<void>;
  updateProfile: (data: { nombre_completo?: string; cargo?: string; foto_url?: string }) => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
  refreshCurrentUser: () => Promise<void>;
  createProject: (project: any) => Promise<Project>;
  updateProject: (id: number, data: Partial<Project>) => Promise<void>;
  updateProjectEstado: (id: number, estado: 'en_curso' | 'terminado' | 'archivado') => Promise<void>;
  createRequest: (request: { proyecto_id: number; mensaje: string }) => Promise<void>;
  updateRequest: (id: number, status: 'accepted' | 'rejected') => Promise<void>;
  createMessage: (message: { proyecto_id: number; contenido: string; archivo_url?: string }) => Promise<void>;
  createTask: (task: any) => Promise<void>;
  updateTask: (id: number, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  addTaskComment: (taskId: number, text: string) => Promise<void>;
  addResource: (resource: any) => Promise<void>;
  deleteResource: (id: number) => Promise<void>;
  approveCompany: (id: number) => Promise<void>;
  blockCompany: (id: number) => Promise<void>;
  unblockCompany: (id: number) => Promise<void>;
  deleteCompany: (id: number) => Promise<void>;
  approveMemberRequest: (requestId: number) => Promise<void>;
  rejectMemberRequest: (requestId: number) => Promise<void>;
  deleteMemberRequest: (requestId: number) => Promise<void>;
  promoteToAdmin: (userId: number) => Promise<void>;
  demoteToUser: (userId: number) => Promise<void>;
  blockUser: (userId: number) => Promise<void>;
  unblockUser: (userId: number) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  transferProject: (projectId: number, newOwnerId: number) => Promise<void>;
  openBase64: (dataUrl: string) => void;
  refreshProjects: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberRequests, setMemberRequests] = useState<MemberRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Proyectos y solicitudes: ahora vienen de TanStack Query (feature
  //    proyectos). Este context solo hace de puente hasta que las páginas
  //    consuman los hooks directamente. ────────────────────────────────────
  const queryClient = useQueryClient();
  const proyectosQuery = useProyectos();
  const archivadosQuery = useProyectosArchivados(!!currentUser);
  const solicitudesQuery = useSolicitudesEnviadas(!!currentUser);
  const projects = proyectosQuery.data ?? [];
  const archivedProjects = archivadosQuery.data ?? [];
  const requests = solicitudesQuery.data ?? [];
  const invalidarProyectos = () =>
    queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.todos });

  // Función auxiliar para cargar datos con reintentos
  const fetchWithRetry = async <T,>(fn: () => Promise<T>, retries = 3): Promise<T | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        console.error(`Attempt ${i + 1} failed:`, err);
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return null;
  };

  const loadInitialData = async () => {
    const token = storage.obtenerToken();
    try {
      if (token) {
        try {
          const user = await authService.obtenerPerfil();
          setCurrentUser(user);
        } catch (err) {
          console.error('Auth persistence error:', err);
          storage.limpiarSesion();
        }
      }

      // Empresas y usuarios (proyectos/solicitudes los maneja TanStack Query).
      const companiesData = await fetchWithRetry(() => api.get<Company[]>('/empresas'));
      setCompanies(companiesData || []);

      const token2 = storage.obtenerToken();
      if (token2) {
        try {
          const usersData = await fetchWithRetry(() => api.get<User[]>('/usuarios'));
          setUsers(usersData || []);
        } catch (err) {
          console.error('Error loading users:', err);
          setUsers([]);
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setCompanies(prev => prev || []);
      setUsers(prev => prev || []);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch and auth persistence
  React.useEffect(() => {
    loadInitialData();
  }, []);

  // Load membership requests when admin of a company logs in
  React.useEffect(() => {
    if (currentUser?.rol === 'admin' && currentUser?.empresa_id) {
      api.get<MemberRequest[]>(`/usuarios/solicitudes/empresa/${currentUser.empresa_id}`)
        .then(data => setMemberRequests(data || []))
        .catch(err => console.error('Error loading member requests:', err));
    }
  }, [currentUser]);

  // Polling silencioso de empresas / usuarios / solicitudes de membresía
  // (cada 15s, salta si la pestaña está oculta). Proyectos y solicitudes de
  // participación ya se refrescan solos vía TanStack Query.
  React.useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const companiesData = await api.get<Company[]>('/empresas').catch(() => null);
        if (companiesData) setCompanies(companiesData);

        const token = storage.obtenerToken();
        if (token) {
          const usersData = await api.get<User[]>('/usuarios').catch(() => null);
          if (usersData) setUsers(usersData);

          if (currentUser?.rol === 'admin' && currentUser?.empresa_id) {
            const memberReqs = await api.get<MemberRequest[]>(`/usuarios/solicitudes/empresa/${currentUser.empresa_id}`).catch(() => null);
            if (memberReqs) setMemberRequests(memberReqs);
          }
        }
      } catch (err) {
        // Fallos silenciosos para no molestar al usuario si hay un microcorte de internet
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const login = async (correo: string, password: string) => {
    try {
      const res = await authService.login({ correo, password });
      storage.guardarToken(res.access_token);
      setCurrentUser(res.user);

      // Cargar datos en segundo plano sin bloquear la redirección de login
      loadInitialData();

      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    storage.limpiarSesion();
    setCurrentUser(null);
  };

  const openBase64 = (base64Data: string) => {
    if (!base64Data || base64Data === '#' || !base64Data.startsWith('data:')) return;
    try {
      const arr = base64Data.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return;

      const mime = mimeMatch[1];
      const bstr = atob(arr[1] || arr[0]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');

      // Liberar memoria luego de un tiempo prudente
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000 * 60);
    } catch (e) {
      console.error('Error opening base64 document:', e);
      toast.error('Error al abrir el documento. Es posible que el archivo esté corrupto.');
    }
  };

  // El registro (empresa / empleado) vive ahora en la feature auth:
  //   useRegistrarEmpresa() / useRegistrarEmpleado() desde '@/features/auth'.

  const updateCompany = async (
    id: number,
    data: Partial<Company> & { imagenes_urls?: string[]; enlaces?: { url: string; nombre?: string }[] },
  ) => {
    const updated = await api.patch<Company>(`/empresas/${id}`, data);
    setCompanies(prev => prev.map(c => c.id === id ? updated : c));
    toast.success('Empresa actualizada');
  };

  // Sube un archivo al backend, que lo redimensiona/comprime (imágenes) y lo
  // devuelve como base64 listo para guardar (foto de perfil, logo, galería).
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const result = await api.post<{ base64: string }>('/recursos/upload', formData);
    return result.base64;
  };

  const updateProfile = async (data: { nombre_completo?: string; cargo?: string; foto_url?: string }) => {
    const updated = await api.patch<User>('/usuarios/me', data);
    setCurrentUser(updated);
    toast.success('Perfil actualizado');
  };

  // Vuelve a pedir el usuario autenticado (ej. tras cambiar la contraseña o
  // marcar el onboarding como completado) sin pasar por login de nuevo.
  const refreshCurrentUser = async () => {
    setCurrentUser(await authService.obtenerPerfil());
  };

  // Puente hacia la feature proyectos. Estas funciones se conservan solo para
  // las páginas que aún consumen useApp(); la lógica real vive en el servicio.
  const createProject = async (project: any) => {
    try {
      const newProject = await proyectosService.crear(project);
      invalidarProyectos();
      toast.success('Proyecto creado exitosamente');
      return newProject;
    } catch (err) {
      console.error('Error al crear proyecto:', err);
      toast.error(err instanceof Error ? err.message : 'Error al crear el proyecto');
      throw err;
    }
  };

  const updateProject = async (id: number, data: Partial<Project>) => {
    await proyectosService.actualizar(id, data);
    invalidarProyectos();
  };

  const updateProjectEstado = async (id: number, estado: 'en_curso' | 'terminado' | 'archivado') => {
    await proyectosService.cambiarEstado(id, estado);
    invalidarProyectos();
    toast.success(
      `Proyecto ${estado === 'archivado' ? 'archivado' : estado === 'terminado' ? 'marcado como terminado' : 'reactivado'} correctamente`,
    );
  };

  const refreshProjects = async () => {
    await invalidarProyectos();
  };

  const createRequest = async (request: { proyecto_id: number; mensaje: string }) => {
    await solicitudesService.crear(request.proyecto_id, request.mensaje);
    queryClient.invalidateQueries({ queryKey: SOLICITUDES_KEYS.enviadas() });
  };

  const updateRequest = async (id: number, status: 'accepted' | 'rejected') => {
    if (status === 'accepted') await solicitudesService.aceptar(id);
    else await solicitudesService.rechazar(id);
    queryClient.invalidateQueries({ queryKey: SOLICITUDES_KEYS.todas });
    invalidarProyectos();
  };

  const createMessage = async (message: { proyecto_id: number; contenido: string; archivo_url?: string }) => {
    const newMessage = await api.post<Message>(`/chats/proyecto/${message.proyecto_id}/mensajes`, {
      contenido: message.contenido,
      archivo_url: message.archivo_url
    });
    setMessages(prev => [...prev, newMessage]);
  };

  const createTask = async (task: any) => {
    const newTask = await api.post<Task>('/tareas', task);
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = async (id: number, data: Partial<Task>) => {
    const updated = await api.patch<Task>(`/tareas/${id}`, data);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const deleteTask = async (id: number) => {
    await api.delete(`/tareas/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTaskComment = async (taskId: number, text: string) => {
    const newComment = await api.post<TaskComment>(`/tareas/${taskId}/comentarios`, { texto: text });
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          comentarios: [...(t.comentarios || []), newComment]
        };
      }
      return t;
    }));
  };

  const addResource = async (resource: any) => {
    const newRes = await api.post<Resource>('/recursos', resource);
    setResources(prev => [...prev, newRes]);
    // El proyecto (con su árbol de recursos) se re-descarga vía TanStack Query.
    invalidarProyectos();
  };

  const deleteResource = async (id: number) => {
    await api.delete(`/recursos/${id}`);
    setResources(prev => prev.filter(r => r.id !== id));
    invalidarProyectos();
  };

  const approveCompany = async (id: number) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, estado: 'aprobado' } : c));
    api.patch(`/empresas/${id}/aprobar`, {}).catch(() => toast.error('Error al aprobar'));
  };

  const blockCompany = async (id: number) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, estado: 'bloqueado' } : c));
    api.patch(`/empresas/${id}/bloquear`, {}).catch(() => toast.error('Error al bloquear'));
  };

  const unblockCompany = async (id: number) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, estado: 'aprobado' } : c));
    api.patch(`/empresas/${id}/desbloquear`, {}).catch(() => toast.error('Error al desbloquear'));
  };

  const deleteCompany = async (id: number) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    api.delete(`/empresas/${id}`).catch(() => toast.error('Error al eliminar'));
  };

  const approveMemberRequest = async (requestId: number) => {
    setMemberRequests(prev => prev.map(mr => mr.id === requestId ? { ...mr, estado: 'aprobado' } : mr));
    api.patch(`/usuarios/solicitudes/${requestId}/aprobar`, {}).catch(() => toast.error('Error al aprobar solicitud'));
  };

  const rejectMemberRequest = async (requestId: number) => {
    setMemberRequests(prev => prev.map(mr => mr.id === requestId ? { ...mr, estado: 'rechazado' } : mr));
    api.patch(`/usuarios/solicitudes/${requestId}/rechazar`, {}).catch(() => toast.error('Error al rechazar solicitud'));
  };

  const deleteMemberRequest = async (requestId: number) => {
    setMemberRequests(prev => prev.filter(mr => mr.id !== requestId));
    api.delete(`/usuarios/solicitudes/${requestId}`).catch(() => toast.error('Error al eliminar solicitud'));
  };

  const promoteToAdmin = async (userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, rol: 'admin' } : u));
    api.patch(`/usuarios/${userId}/promover`, {}).catch(() => toast.error('Error al promover'));
  };

  const demoteToUser = async (userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, rol: 'empleado' } : u));
    api.patch(`/usuarios/${userId}/degradar`, {}).catch(() => toast.error('Error al degradar'));
  };

  const blockUser = async (userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, estado: 'bloqueado' } : u));
    api.patch(`/usuarios/${userId}/bloquear`, {}).catch(() => toast.error('Error al bloquear usuario'));
  };

  const unblockUser = async (userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, estado: 'activo' } : u));
    api.patch(`/usuarios/${userId}/desbloquear`, {}).catch(() => toast.error('Error al desbloquear usuario'));
  };

  const deleteUser = async (userId: number) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      api.delete(`/usuarios/${userId}`).catch(() => toast.error('Error al eliminar usuario'));
    }
  };

  const transferProject = async (projectId: number, newOwnerId: number) => {
    await proyectosService.transferir(projectId, newOwnerId);
    invalidarProyectos();
    toast.success('Proyecto transferido exitosamente');
  };


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground animate-pulse text-lg font-medium">Iniciando aplicación...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        companies,
        projects,
        archivedProjects,
        requests,
        messages,
        tasks,
        resources,
        memberRequests,
        loading,
        login,
        logout,
        updateCompany,
        updateProfile,
        uploadFile,
        refreshCurrentUser,
        createProject,
        updateProject,
        updateProjectEstado,
        refreshProjects,
        createRequest,
        updateRequest,
        createMessage,
        createTask,
        updateTask,
        deleteTask,
        addTaskComment,
        addResource,
        deleteResource,
        approveCompany,
        blockCompany,
        unblockCompany,
        deleteCompany,
        approveMemberRequest,
        rejectMemberRequest,
        deleteMemberRequest,
        promoteToAdmin,
        demoteToUser,
        blockUser,
        unblockUser,
        deleteUser,
        openBase64,
        transferProject,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}