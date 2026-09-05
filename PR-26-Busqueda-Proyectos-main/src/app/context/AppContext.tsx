import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { storage } from '@/lib/storage';
import { config } from '@/lib/config';
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
import { empresasService, EMPRESAS_KEYS, useEmpresas } from '@/features/empresas';
import { usuariosService, USUARIOS_KEYS, useUsuarios } from '@/features/usuarios';

/* Los tipos del dominio viven en /shared y /features (Anexo B7); se importan
 * aquí solo para las firmas internas de AppContextType. */
import type { User } from '@/shared/types/user.types';
import type { Company } from '@/features/empresas/types/empresas.types';
import type {
  Project,
  Request,
  CrearProjectDto,
} from '@/features/proyectos/types/proyectos.types';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  companies: Company[];
  projects: Project[];
  archivedProjects: Project[];
  requests: Request[];
  loading: boolean;
  login: (correo: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => void;
  updateCompany: (
    id: number,
    data: Partial<Company> & { imagenes_urls?: string[]; enlaces?: { url: string; nombre?: string }[] },
  ) => Promise<void>;
  updateProfile: (data: { nombre_completo?: string; cargo?: string; foto_url?: string }) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  createProject: (project: CrearProjectDto) => Promise<Project>;
  updateProject: (id: number, data: Partial<Project>) => Promise<void>;
  updateProjectEstado: (id: number, estado: 'en_curso' | 'terminado' | 'archivado') => Promise<void>;
  createRequest: (request: { proyecto_id: number; mensaje: string }) => Promise<void>;
  updateRequest: (id: number, status: 'accepted' | 'rejected') => Promise<void>;
  approveCompany: (id: number) => Promise<void>;
  blockCompany: (id: number) => Promise<void>;
  unblockCompany: (id: number) => Promise<void>;
  deleteCompany: (id: number) => Promise<void>;
  transferProject: (projectId: number, newOwnerId: number) => Promise<void>;
  openBase64: (dataUrl: string) => void;
  refreshProjects: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Datos del servidor: TanStack Query. Este context solo hace de puente
  //    hasta que las páginas consuman los hooks directamente. ─────────────
  const queryClient = useQueryClient();

  const projects = useProyectos().data ?? [];
  const archivedProjects = useProyectosArchivados(!!currentUser).data ?? [];
  const requests = useSolicitudesEnviadas(!!currentUser).data ?? [];
  const companies = useEmpresas().data ?? [];
  const users = useUsuarios(!!currentUser).data ?? [];

  const invalidarProyectos = () =>
    queryClient.invalidateQueries({ queryKey: PROYECTOS_KEYS.todos });
  const invalidarEmpresas = () =>
    queryClient.invalidateQueries({ queryKey: EMPRESAS_KEYS.todas });
  const invalidarUsuarios = () =>
    queryClient.invalidateQueries({ queryKey: USUARIOS_KEYS.todos });

  // Persistencia de sesión: si hay token al arrancar, recuperar el usuario.
  React.useEffect(() => {
    const token = storage.obtenerToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .obtenerPerfil()
      .then(setCurrentUser)
      .catch(() => storage.limpiarSesion())
      .finally(() => setLoading(false));
  }, []);

  const login = async (correo: string, password: string) => {
    try {
      const res = await authService.login({ correo, password });
      storage.guardarToken(res.access_token);
      setCurrentUser(res.user);
      // El resto de datos los cargan los hooks de TanStack Query al activarse
      // la sesión (enabled: !!currentUser).
      return { success: true, user: res.user };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: err instanceof Error ? err.message : 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    storage.limpiarSesion();
    setCurrentUser(null);
    queryClient.clear();
  };

  // Abre un documento en una pestaña nueva. Acepta tanto el formato histórico
  // (data URL en base64) como la ruta de un archivo en disco (`/api/archivos/...`).
  const openBase64 = async (valor: string) => {
    if (!valor || valor === '#') return;

    // Histórico: data URL -> blob local.
    if (valor.startsWith('data:')) {
      try {
        const arr = valor.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1] || arr[0]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const blobUrl = URL.createObjectURL(new Blob([u8arr], { type: mime }));
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000 * 60);
      } catch (e) {
        console.error('Error opening base64 document:', e);
        toast.error('Error al abrir el documento. Es posible que el archivo esté corrupto.');
      }
      return;
    }

    // Nuevo: archivo servido por el backend. El bucket privado exige el token de
    // sesión, que window.open no envía, así que se baja con fetch autenticado.
    //
    // OJO: la pestaña se abre ANTES del fetch (sincrónico, dentro del mismo
    // click) y se le mete el blob adentro cuando llega. Si se abre después del
    // await, el navegador ya no lo asocia al click del usuario y bloquea el
    // popup en silencio — el request se ve en Network pero no se abre nada, y
    // como no había ningún indicio de carga, parecía que el botón no hacía nada.
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(
        '<title>Abriendo documento…</title><body style="font:14px sans-serif;color:#666;padding:2rem">Abriendo documento…</body>',
      );
    }
    const toastId = toast.loading('Abriendo documento…');
    try {
      const url = valor.startsWith('/')
        ? `${config.apiUrl.replace(/\/api$/, '')}${valor}`
        : valor;
      const token = storage.obtenerToken();
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blobUrl = URL.createObjectURL(await res.blob());
      let abierta = false;
      if (ventana && !ventana.closed) {
        ventana.location.href = blobUrl;
        abierta = true;
      } else {
        // El navegador bloqueó la pestaña reservada: se intenta igual, aunque
        // en algunos navegadores esto también se bloquee.
        abierta = !!window.open(blobUrl, '_blank');
      }
      toast.dismiss(toastId);
      if (!abierta) {
        toast.error('El navegador bloqueó la ventana. Habilitá las ventanas emergentes para este sitio e intentá de nuevo.');
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000 * 60);
    } catch (e) {
      toast.dismiss(toastId);
      ventana?.close();
      console.error('Error opening document:', e);
      toast.error('No se pudo abrir el documento.');
    }
  };

  // El registro (empresa / empleado) vive ahora en la feature auth:
  //   useRegistrarEmpresa() / useRegistrarEmpleado() desde '@/features/auth'.

  const updateCompany = async (
    id: number,
    data: Partial<Company> & { imagenes_urls?: string[]; enlaces?: { url: string; nombre?: string }[] },
  ) => {
    await empresasService.actualizar(id, data);
    invalidarEmpresas();
    toast.success('Empresa actualizada');
  };

  const updateProfile = async (data: { nombre_completo?: string; cargo?: string; foto_url?: string }) => {
    const updated = await usuariosService.actualizarPerfil(data);
    setCurrentUser(updated);
    invalidarUsuarios();
    toast.success('Perfil actualizado');
  };

  // Vuelve a pedir el usuario autenticado (ej. tras cambiar la contraseña o
  // marcar el onboarding como completado) sin pasar por login de nuevo.
  const refreshCurrentUser = async () => {
    setCurrentUser(await authService.obtenerPerfil());
  };

  // Puente hacia la feature proyectos. Estas funciones se conservan solo para
  // las páginas que aún consumen useApp(); la lógica real vive en el servicio.
  const createProject = async (project: CrearProjectDto) => {
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
    await solicitudesService.crear(request.proyecto_id, { mensaje: request.mensaje });
    queryClient.invalidateQueries({ queryKey: SOLICITUDES_KEYS.enviadas() });
  };

  const updateRequest = async (id: number, status: 'accepted' | 'rejected') => {
    if (status === 'accepted') await solicitudesService.aceptar(id);
    else await solicitudesService.rechazar(id);
    queryClient.invalidateQueries({ queryKey: SOLICITUDES_KEYS.todas });
    invalidarProyectos();
  };

  // Chat, tareas y recursos se consumen ahora desde '@/features/workspace'
  // (useMensajesChat, useEnviarMensaje, useTareasProyecto, useRecursos, ...).

  const approveCompany = async (id: number) => {
    try { await empresasService.aprobar(id); } catch { toast.error('Error al aprobar'); }
    invalidarEmpresas();
  };

  const blockCompany = async (id: number) => {
    try { await empresasService.bloquear(id); } catch { toast.error('Error al bloquear'); }
    invalidarEmpresas();
  };

  const unblockCompany = async (id: number) => {
    try { await empresasService.desbloquear(id); } catch { toast.error('Error al desbloquear'); }
    invalidarEmpresas();
  };

  const deleteCompany = async (id: number) => {
    try { await empresasService.eliminar(id); } catch { toast.error('Error al eliminar'); }
    invalidarEmpresas();
  };

  // La moderación de usuarios y las solicitudes de membresía se consumen ahora
  // directamente desde '@/features/usuarios' (useModerarUsuario,
  // useSolicitudesMembresia, useResponderSolicitudMembresia, ...).

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
        loading,
        login,
        logout,
        updateCompany,
        updateProfile,
        refreshCurrentUser,
        createProject,
        updateProject,
        updateProjectEstado,
        refreshProjects,
        createRequest,
        updateRequest,
        approveCompany,
        blockCompany,
        unblockCompany,
        deleteCompany,
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