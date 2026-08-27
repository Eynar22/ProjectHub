/* ============================================================================
 * src/features/proyectos/services/proyectos.service.ts
 *
 * Responsabilidad: hablar con los endpoints de proyectos del backend.
 * NO maneja estado. NO muestra toasts. NO conoce React.
 * ========================================================================= */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  Project,
  ProjectEstado,
  CrearProjectDto,
  ActualizarProjectDto,
} from '../types/proyectos.types';

/** Sube un archivo y devuelve su representación base64 (el backend comprime). */
async function subirArchivo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { base64 } = await apiClient.post<{ base64: string }>(
    ENDPOINTS.RECURSOS.UPLOAD,
    formData,
  );
  return base64;
}

export const proyectosService = {
  /** Todos los proyectos activos (no archivados). */
  async listar(): Promise<Project[]> {
    return apiClient.get<Project[]>(ENDPOINTS.PROYECTOS.LISTAR);
  },

  /** Proyectos archivados del usuario (solo dueños / superadmin). */
  async listarArchivados(): Promise<Project[]> {
    return apiClient.get<Project[]>(ENDPOINTS.PROYECTOS.ARCHIVADOS);
  },

  /** Proyecto por id, con todas sus relaciones. */
  async obtenerPorId(id: number | string): Promise<Project> {
    return apiClient.get<Project>(ENDPOINTS.PROYECTOS.DETALLE(id));
  },

  /** Crea un proyecto: primero sube imágenes/PDF, luego crea el registro. */
  async crear(dto: CrearProjectDto): Promise<Project> {
    const [imagenes_urls, pdfs] = await Promise.all([
      Promise.all((dto.imageFiles ?? []).map(subirArchivo)),
      Promise.all((dto.pdfFiles ?? []).map(subirArchivo)),
    ]);

    return apiClient.post<Project>(ENDPOINTS.PROYECTOS.CREAR, {
      nombre: dto.name,
      descripcion_corta: dto.shortDescription,
      descripcion_completa: dto.description,
      categoria: dto.categoria || 'Tecnología',
      fecha_inicio: dto.startDate,
      fecha_fin: dto.endDate,
      financiamiento: dto.funding != null && dto.funding !== '' ? parseFloat(String(dto.funding)) : null,
      documento_url: pdfs[0] ?? null,
      imagenes_urls,
      creador_id: dto.createdByUserId,
    });
  },

  /** Actualiza campos parciales de un proyecto. */
  async actualizar(id: number | string, dto: ActualizarProjectDto): Promise<Project> {
    return apiClient.patch<Project>(ENDPOINTS.PROYECTOS.ACTUALIZAR(id), dto);
  },

  /** Cambia el estado (en_curso / terminado / archivado). */
  async cambiarEstado(id: number | string, estado: ProjectEstado): Promise<Project> {
    return apiClient.patch<Project>(ENDPOINTS.PROYECTOS.ESTADO(id), { estado });
  },

  /** Transfiere la propiedad del proyecto a otro usuario de la misma empresa. */
  async transferir(id: number | string, nuevoCreadorId: number): Promise<void> {
    await apiClient.patch(ENDPOINTS.PROYECTOS.TRANSFERIR(id), {
      nuevo_creador_id: nuevoCreadorId,
    });
  },

  /** Termina automáticamente los proyectos cuya fecha de fin ya pasó (admin). */
  async autoTerminar(): Promise<{ actualizados: number }> {
    return apiClient.post<{ actualizados: number }>(ENDPOINTS.PROYECTOS.AUTO_TERMINAR, {});
  },

  /** Cambia el rol de un participante dentro del workspace del proyecto. */
  async cambiarRolParticipante(
    proyectoId: number | string,
    usuarioId: number | string,
    rol: string,
  ): Promise<void> {
    await apiClient.patch(ENDPOINTS.PROYECTOS.PARTICIPANTE(proyectoId, usuarioId), { rol });
  },
};
