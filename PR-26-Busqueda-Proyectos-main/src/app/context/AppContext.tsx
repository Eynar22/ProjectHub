import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';

// Types
export type UserRole = 'superadmin' | 'admin' | 'empleado';

export interface User {
  id: number;
  correo: string;
  nombre_completo: string;
  cargo?: string; // cargo/posicion dentro de la empresa
  rol: UserRole;
  empresa_id?: number | null;
  estado?: string;
  documento_url?: string;
  empresa?: { id: number; nombre: string };
}

export interface Company {
  id: number;
  nombre: string;
  descripcion: string;
  num_empleados: number;
  portafolio: string;
  contacto: string;
  estado: 'pendiente' | 'aprobado' | 'bloqueado' | 'rechazado';
  fecha_creacion: string;
  logo?: string;
  documento_url?: string;
  fecha_registro?: string;
  fecha_aprobacion?: string;
  usuarios?: User[];
}

export interface MemberRequest {
  id: number;
  empresa_id: number;
  usuario_id: number;
  usuario?: User;
  documento_url?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_creacion: string;
}

export interface CompanyRegistrant {
  name: string;
  jobTitle: string;
  email: string;
}

export interface Project {
  id: number;
  nombre: string;
  descripcion_corta?: string;
  descripcion_completa?: string;
  categoria: string;
  imagenes: { id: number; url: string }[];
  fecha_inicio: string;
  fecha_fin: string;
  financiamiento?: number;
  documento_url?: string;
  creador_id: number;
  estado: 'en_curso' | 'terminado' | 'archivado';
  suspendido?: boolean;
  participantes?: { usuario_id: number, rol: string, usuario: User }[];
  recursos?: Resource[];
  fecha_creacion?: string;
}

export interface Request {
  id: number;
  proyecto_id: number;
  usuario_id: number;
  mensaje: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  fecha_creacion: string;
  usuario?: User;
}

export interface Message {
  id: number;
  chat_id: number;
  usuario_id: number;
  contenido: string;
  archivo_url?: string;
  fecha: string;
  usuario?: User;
}

export interface Task {
  id: number;
  proyecto_id: number;
  columna_id: number;
  usuario_id?: number;
  titulo: string;
  descripcion?: string;
  prioridad: 'baja' | 'media' | 'alta';
  fecha_limite: string;
  orden: number;
  fecha_creacion: string;
  usuario?: User;
  comentarios?: TaskComment[];
}

export interface TaskComment {
  id: number;
  tarea_id: number;
  usuario_id: number;
  texto: string;
  fecha_creacion: string;
  usuario?: User;
}

export interface Resource {
  id: number;
  proyecto_id: number;
  nombre: string;
  tipo: 'archivo' | 'carpeta';
  url?: string;
  padre_id?: number | null;
  fecha_creacion: string;
}

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
  register: (
    correo: string,
    password: string,
    companyData: { nombre: string; descripcion: string; num_empleados: number; portafolio: string },
    registrant: { name: string; jobTitle: string; personalDocument: File; companyDocument: File }
  ) => Promise<void>;
  registerToCompany: (
    userData: { name: string; email: string; password: string; jobTitle: string; memberDocument: File },
    companyId: number
  ) => Promise<void>;
  updateCompany: (id: number, data: Partial<Company>) => Promise<void>;
  createProject: (project: any) => Promise<void>;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [memberRequests, setMemberRequests] = useState<MemberRequest[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

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
    const token = localStorage.getItem('token');
    try {
      if (token) {
        try {
          const user = await api.get<User>('/auth/profile');
          setCurrentUser(user);
        } catch (err) {
          console.error('Auth persistence error:', err);
          localStorage.removeItem('token');
        }
      }

      // Load companies and projects with retry logic
      const companiesData = await fetchWithRetry(() => api.get<Company[]>('/empresas'));
      const projectsData = await fetchWithRetry(() => api.get<Project[]>('/proyectos'));

      setCompanies(companiesData || []);
      setProjects(projectsData || []);

      const token2 = localStorage.getItem('token');
      if (token2) {
        try {
          const [usersData, requestsData] = await Promise.all([
            fetchWithRetry(() => api.get<User[]>('/usuarios')),
            fetchWithRetry(() => api.get<any[]>('/proyectos/usuario/solicitudes-enviadas'))
          ]);
          setUsers(usersData || []);
          setRequests(requestsData || []);
        } catch (err) {
          console.error('Error loading users or requests:', err);
          setUsers([]);
          setRequests([]);
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setCompanies(prev => prev || []);
      setProjects(prev => prev || []);
      setUsers(prev => prev || []);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch and auth persistence
  React.useEffect(() => {
    loadInitialData();
  }, []);

  // Load archived projects when user logs in (only for owners/superadmin)
  React.useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    api.get<Project[]>('/proyectos/archivados')
      .then(data => setArchivedProjects(data || []))
      .catch(() => setArchivedProjects([]));
  }, [currentUser?.id]);

  // Load membership requests when admin of a company logs in
  React.useEffect(() => {
    if (currentUser?.rol === 'admin' && currentUser?.empresa_id) {
      api.get<MemberRequest[]>(`/usuarios/solicitudes/empresa/${currentUser.empresa_id}`)
        .then(data => setMemberRequests(data || []))
        .catch(err => console.error('Error loading member requests:', err));
    }
  }, [currentUser]);

  // Polling silencioso para actualizaciones en "tiempo real" (cada 15 segundos)
  React.useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [companiesData, projectsData] = await Promise.all([
          api.get<Company[]>('/empresas').catch(() => null),
          api.get<Project[]>('/proyectos').catch(() => null)
        ]);

        if (companiesData) setCompanies(companiesData);
        if (projectsData) setProjects(projectsData);

        const token = localStorage.getItem('token');
        if (token) {
          const usersData = await api.get<User[]>('/usuarios').catch(() => null);
          if (usersData) setUsers(usersData);

          const archivedData = await api.get<Project[]>('/proyectos/archivados').catch(() => null);
          if (archivedData) setArchivedProjects(archivedData);

          const requestsData = await api.get<any[]>('/proyectos/usuario/solicitudes-enviadas').catch(() => null);
          if (requestsData) setRequests(requestsData);

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
      const res = await api.post<{ access_token: string, user: User }>('/auth/login', { correo, password });
      localStorage.setItem('token', res.access_token);
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
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
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

  const register = async (
    correo: string,
    password: string,
    companyData: { nombre: string; descripcion: string; num_empleados: number; portafolio: string },
    registrant: { name: string; jobTitle: string; personalDocument: File; companyDocument: File }
  ) => {
    const docEmpresaBase64 = await fileToBase64(registrant.companyDocument);
    const docPersonalBase64 = await fileToBase64(registrant.personalDocument);

    await api.post('/auth/register/empresa', {
      correo,
      password,
      nombre_empresa: companyData.nombre,
      descripcion: companyData.descripcion,
      num_empleados: companyData.num_empleados,
      portafolio: companyData.portafolio,
      documento_empresa_url: docEmpresaBase64,
      nombre_completo: registrant.name,
      cargo: registrant.jobTitle,
      documento_personal_url: docPersonalBase64,
    });
  };

  const registerToCompany = async (
    userData: { name: string; email: string; password: string; jobTitle: string; memberDocument: File },
    companyId: number
  ) => {
    const docPersonalBase64 = await fileToBase64(userData.memberDocument);

    await api.post('/auth/register/empleado', {
      nombre_completo: userData.name,
      correo: userData.email,
      password: userData.password,
      cargo: userData.jobTitle,
      documento_url: docPersonalBase64,
      empresa_id: companyId,
    });
  };

  const updateCompany = async (id: number, data: Partial<Company>) => {
    const updated = await api.patch<Company>(`/empresas/${id}`, data);
    setCompanies(prev => prev.map(c => c.id === id ? updated : c));
  };

  const createProject = async (project: any) => {
    try {
      // Upload images if provided and convert to base64
      let imageBase64s: string[] = [];
      if (project.imageFiles && project.imageFiles.length > 0) {
        imageBase64s = await Promise.all(
          project.imageFiles.map(async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const result = await api.post<any>('/recursos/upload', formData);
            return result.base64;
          })
        );
      }

      // Upload PDFs if provided and convert to base64
      let pdfBase64s: string[] = [];
      if (project.pdfFiles && project.pdfFiles.length > 0) {
        pdfBase64s = await Promise.all(
          project.pdfFiles.map(async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const result = await api.post<any>('/recursos/upload', formData);
            return result.base64;
          })
        );
      }

      // Create project with base64 data - IMPORTANT: Use correct field names from entity
      const newProject = await api.post<Project>('/proyectos', {
        nombre: project.name,
        descripcion_corta: project.shortDescription,
        descripcion_completa: project.description,
        categoria: project.categoria || 'Tecnología',
        fecha_inicio: project.startDate,
        fecha_fin: project.endDate,
        financiamiento: project.funding ? parseFloat(project.funding) : null,
        documento_url: pdfBase64s.length > 0 ? pdfBase64s[0] : null,
        imagenes_urls: imageBase64s,
        creador_id: project.createdByUserId,
      });

      setProjects(prev => [...prev, newProject]);
      toast.success('Proyecto creado exitosamente');
    } catch (err) {
      console.error('Error al crear proyecto:', err);
      toast.error('Error al crear el proyecto');
      throw err;
    }
  };

  const updateProject = async (id: number, data: Partial<Project>) => {
    const updated = await api.patch<Project>(`/proyectos/${id}`, data);
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
  };

  const updateProjectEstado = async (id: number, estado: 'en_curso' | 'terminado' | 'archivado') => {
    const updated = await api.patch<Project>(`/proyectos/${id}/estado`, { estado });

    // Preserve loaded relations (participantes, imagenes, etc.) by merging with original project
    const original = projects.find(p => p.id === id) || archivedProjects.find(p => p.id === id);
    const merged = original ? { ...original, ...updated } : updated;

    if (estado === 'archivado') {
      // Move from active projects to archived
      setProjects(prev => prev.filter(p => p.id !== id));
      setArchivedProjects(prev => {
        const exists = prev.find(p => p.id === id);
        return exists ? prev.map(p => p.id === id ? merged : p) : [...prev, merged];
      });
    } else {
      // Could be un-archiving or changing between en_curso/terminado
      setArchivedProjects(prev => prev.filter(p => p.id !== id));
      setProjects(prev => {
        const exists = prev.find(p => p.id === id);
        return exists ? prev.map(p => p.id === id ? merged : p) : [...prev, merged];
      });
    }
    toast.success(`Proyecto ${estado === 'archivado' ? 'archivado' : estado === 'terminado' ? 'marcado como terminado' : 'reactivado'} correctamente`);
  };

  const refreshProjects = async () => {
    try {
      const projectsData = await api.get<Project[]>('/proyectos');
      setProjects(projectsData || []);
      const token = localStorage.getItem('token');
      if (token) {
        const archived = await api.get<Project[]>('/proyectos/archivados');
        setArchivedProjects(archived || []);
      }
    } catch (err) {
      console.error('Error refreshing projects:', err);
    }
  };

  const createRequest = async (request: { proyecto_id: number; mensaje: string }) => {
    const newReq = await api.post<any>(`/proyectos/${request.proyecto_id}/solicitudes`, { mensaje: request.mensaje });
    setRequests(prev => [...prev, newReq]);
  };

  const updateRequest = async (id: number, status: 'accepted' | 'rejected') => {
    const endpoint = status === 'accepted' ? 'aceptar' : 'rechazar';
    await api.patch(`/proyectos/solicitudes/${id}/${endpoint}`, {});
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
    // Also update the project's recursos array so UI reflects the change immediately
    setProjects(prev => prev.map(p =>
      p.id === resource.proyecto_id
        ? { ...p, recursos: [...(p.recursos || []), newRes] }
        : p
    ));
  };

  const deleteResource = async (id: number) => {
    await api.delete(`/recursos/${id}`);
    setResources(prev => prev.filter(r => r.id !== id));
    // Also remove from the project's recursos array
    setProjects(prev => prev.map(p => ({
      ...p,
      recursos: (p.recursos || []).filter(r => r.id !== id),
    })));
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
    await api.patch(`/proyectos/${projectId}/transferir`, { nuevo_creador_id: newOwnerId });
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, creador_id: newOwnerId, suspendido: false }
        : p
    ));
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
        register,
        registerToCompany,
        updateCompany,
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