import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../entities/proyecto.entity';
import { ProyectoImagen } from '../entities/proyecto-imagen.entity';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { SolicitudProyecto } from '../entities/solicitud-proyecto.entity';
import { Usuario } from '../entities/usuario.entity';
import { Chat } from '../entities/chat.entity';
import { KanbanColumna } from '../entities/kanban-columna.entity';
import { Recurso } from '../entities/recurso.entity';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';

@Injectable()
export class ProyectoService {
  // Columnas livianas del proyecto: excluye documento_url (el PDF de acreditación en
  // base64). No se usa: el frontend nunca renderiza project.documento_url, porque ese
  // mismo PDF ya queda accesible como Recurso dentro de la carpeta "Principal".
  private static readonly PROYECTO_SELECT = {
    id: true,
    nombre: true,
    descripcion_corta: true,
    descripcion_completa: true,
    problema: true,
    fecha_inicio: true,
    fecha_fin: true,
    financiamiento: true,
    categoria: true,
    ods: true,
    estado: true,
    suspendido: true,
    fecha_creacion: true,
    creador_id: true,
  } as const;

  // Campos del usuario participante/creador que realmente se muestran (nombre, cargo,
  // correo, empresa) — nunca documento_url, el documento personal de acreditación en
  // base64 que se cargaba de más por cada participante de cada proyecto.
  private static readonly USUARIO_LIGERO_SELECT = {
    id: true,
    nombre_completo: true,
    correo: true,
    cargo: true,
    foto_url: true,
    empresa_id: true,
  } as const;

  constructor(
    @InjectRepository(Proyecto) private proyectoRepo: Repository<Proyecto>,
    @InjectRepository(ProyectoImagen) private imagenRepo: Repository<ProyectoImagen>,
    @InjectRepository(UsuarioProyecto) private upRepo: Repository<UsuarioProyecto>,
    @InjectRepository(SolicitudProyecto) private solicitudRepo: Repository<SolicitudProyecto>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Chat) private chatRepo: Repository<Chat>,
    @InjectRepository(KanbanColumna) private columnaRepo: Repository<KanbanColumna>,
    @InjectRepository(Recurso) private recursoRepo: Repository<Recurso>,
    private almacenamiento: AlmacenamientoService,
  ) { }

  // 'recursos' queda afuera de los listados a propósito: solo se usa en la vista de
  // un único proyecto (Workspace/ProjectDetail), y además duplicaba el mismo base64
  // de imágenes/PDF que ya viaja en 'imagenes' (se guardan también como Recurso).
  async findAll() {
    return this.proyectoRepo.find({
      where: [{ estado: 'en_curso' }, { estado: 'terminado' }],
      relations: ['imagenes', 'participantes', 'participantes.usuario'],
      select: {
        ...ProyectoService.PROYECTO_SELECT,
        imagenes: { id: true, url: true },
        participantes: {
          usuario_id: true,
          proyecto_id: true,
          rol: true,
          usuario: ProyectoService.USUARIO_LIGERO_SELECT,
        },
      },
    });
  }

  /** For superadmin: returns ALL projects regardless of estado */
  async findAllAdmin() {
    return this.proyectoRepo.find({
      relations: ['imagenes', 'participantes', 'participantes.usuario'],
      select: {
        ...ProyectoService.PROYECTO_SELECT,
        imagenes: { id: true, url: true },
        participantes: {
          usuario_id: true,
          proyecto_id: true,
          rol: true,
          usuario: ProyectoService.USUARIO_LIGERO_SELECT,
        },
      },
    });
  }

  /** Returns only archived projects (visible only to superadmin or the project owner) */
  async findArchivados(userId?: number, rol?: string) {
    const where: any = { estado: 'archivado' };
    if (rol !== 'superadmin' && userId) {
      where.creador_id = userId;
    }
    return this.proyectoRepo.find({
      where,
      relations: ['imagenes', 'participantes', 'participantes.usuario'],
      select: {
        ...ProyectoService.PROYECTO_SELECT,
        imagenes: { id: true, url: true },
        participantes: {
          usuario_id: true,
          proyecto_id: true,
          rol: true,
          usuario: ProyectoService.USUARIO_LIGERO_SELECT,
        },
      },
    });
  }

  // Vista de un único proyecto (Workspace/ProjectDetail): sí necesita 'recursos'
  // (pestaña de recursos) e 'imagenes' completas, pero documento_url del proyecto y
  // el documento personal de cada participante/creador siguen sin usarse ahí.
  async findOne(id: number) {
    const proyecto = await this.proyectoRepo.findOne({
      where: { id },
      relations: ['imagenes', 'participantes', 'participantes.usuario', 'recursos', 'creador'],
      select: {
        ...ProyectoService.PROYECTO_SELECT,
        imagenes: { id: true, url: true },
        participantes: {
          usuario_id: true,
          proyecto_id: true,
          rol: true,
          usuario: ProyectoService.USUARIO_LIGERO_SELECT,
        },
        recursos: { id: true, proyecto_id: true, nombre: true, tipo: true, url: true, padre_id: true, fecha_creacion: true },
        creador: ProyectoService.USUARIO_LIGERO_SELECT,
      },
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    return proyecto;
  }

  async findByUser(usuarioId: number) {
    const participaciones = await this.upRepo.find({
      where: { usuario_id: usuarioId },
      relations: ['proyecto', 'proyecto.imagenes'],
      select: {
        usuario_id: true,
        proyecto_id: true,
        rol: true,
        proyecto: {
          ...ProyectoService.PROYECTO_SELECT,
          imagenes: { id: true, url: true },
        },
      },
    });
    return participaciones.map((p) => ({ ...p.proyecto, rol_en_proyecto: p.rol }));
  }

  async create(data: Partial<Proyecto> & { imagenes_urls?: string[]; creador_id: number }) {
    const { imagenes_urls, ...datosProyecto } = data;

    const proyecto = this.proyectoRepo.create(datosProyecto);
    const savedProyecto = await this.proyectoRepo.save(proyecto);

    // Create root Resources folder
    const recursoRaiz = this.recursoRepo.create({
      proyecto_id: savedProyecto.id,
      nombre: 'Recursos',
      tipo: 'carpeta',
    });
    const recursoRaizGuardado = await this.recursoRepo.save(recursoRaiz);

    // Create Principal folder inside Recursos
    const carpetaPrincipal = this.recursoRepo.create({
      proyecto_id: savedProyecto.id,
      nombre: 'Principal',
      tipo: 'carpeta',
      padre_id: recursoRaizGuardado.id,
    });
    const carpetaPrincipalGuardada = await this.recursoRepo.save(carpetaPrincipal);

    // Add images as resources
    if (imagenes_urls && imagenes_urls.length > 0) {
      const imagenes = imagenes_urls.map((url, idx) =>
        this.imagenRepo.create({ proyecto_id: savedProyecto.id, url }),
      );
      await this.imagenRepo.save(imagenes);

      // Guardar imágenes dentro de la carpeta Principal
      const recursosImagenes = imagenes_urls.map((url, idx) =>
        this.recursoRepo.create({
          proyecto_id: savedProyecto.id,
          nombre: `imagen-${idx + 1}.jpg`,
          tipo: 'archivo',
          url: url,
          padre_id: carpetaPrincipalGuardada.id,
        }),
      );
      await this.recursoRepo.save(recursosImagenes);
    }

    // Add PDF as resource if provided
    if (datosProyecto.documento_url) {
      const recursoPDF = this.recursoRepo.create({
        proyecto_id: savedProyecto.id,
        nombre: 'documento.pdf',
        tipo: 'archivo',
        url: datosProyecto.documento_url,
        padre_id: carpetaPrincipalGuardada.id,
      });
      await this.recursoRepo.save(recursoPDF);
    }

    // Add creator as admin participant
    const participante = this.upRepo.create({
      usuario_id: data.creador_id,
      proyecto_id: savedProyecto.id,
      rol: 'admin',
    });
    await this.upRepo.save(participante);

    // Create chat for the project
    const chat = this.chatRepo.create({ proyecto_id: savedProyecto.id });
    await this.chatRepo.save(chat);

    // Create default kanban columns
    const defaultColumns = [
      { proyecto_id: savedProyecto.id, nombre: 'Por Hacer', orden: 1 },
      { proyecto_id: savedProyecto.id, nombre: 'En Progreso', orden: 2 },
      { proyecto_id: savedProyecto.id, nombre: 'Completado', orden: 3 },
    ];
    await this.columnaRepo.save(defaultColumns.map((c) => this.columnaRepo.create(c)));

    return this.findOne(savedProyecto.id);
  }

  async update(id: number, data: Partial<Proyecto> & { imagenes_urls?: string[] }) {
    const { imagenes_urls, ods, ...proyectoData } = data;

    if (Object.keys(proyectoData).length > 0) {
      await this.proyectoRepo.update(id, proyectoData);
    }

    // 'ods' es una columna simple-json: se escribe con save() para asegurar que
    // el transformador serialice el arreglo (repository.update no siempre lo hace).
    if (ods !== undefined) {
      await this.proyectoRepo.save({ id, ods: Array.isArray(ods) ? ods : [] });
    }

    if (imagenes_urls) {
      // Reemplaza la galería. Guarda las urls viejas para borrar sus archivos
      // después, pero solo si ya no las referencia nada (la misma imagen suele
      // existir también como Recurso).
      const previas = await this.imagenRepo.find({ where: { proyecto_id: id } });
      await this.imagenRepo.delete({ proyecto_id: id });
      const imagenes = imagenes_urls.map((url) =>
        this.imagenRepo.create({ proyecto_id: id, url }),
      );
      await this.imagenRepo.save(imagenes);
      await this.almacenamiento.eliminarPorUrlsSiHuerfanas(
        previas.map((p) => p.url).filter((u) => !imagenes_urls.includes(u)),
      );
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const proyecto = await this.findOne(id);

    // Junta las urls de archivos del proyecto ANTES de borrar (el CASCADE de la
    // BD elimina proyecto_imagen y recurso, pero no toca el disco). findOne()
    // excluye documento_url por el select, así que se pide aparte.
    const [conDoc, imgs, recs] = await Promise.all([
      this.proyectoRepo.findOne({ where: { id }, select: { id: true, documento_url: true } }),
      this.imagenRepo.find({ where: { proyecto_id: id } }),
      this.recursoRepo.find({ where: { proyecto_id: id } }),
    ]);
    const urls = [
      conDoc?.documento_url,
      ...imgs.map((i) => i.url),
      ...recs.map((r) => r.url),
    ];

    await this.proyectoRepo.remove(proyecto);
    await this.almacenamiento.eliminarPorUrlsSiHuerfanas(urls);
    return { message: 'Proyecto eliminado' };
  }

  // Participant management
  async addParticipant(proyectoId: number, usuarioId: number, rol = 'colaborador') {
    const existing = await this.upRepo.findOne({
      where: { proyecto_id: proyectoId, usuario_id: usuarioId },
    });
    if (existing) return existing;

    const participante = this.upRepo.create({
      proyecto_id: proyectoId,
      usuario_id: usuarioId,
      rol,
    });
    return this.upRepo.save(participante);
  }

  async removeParticipant(proyectoId: number, usuarioId: number, user?: any) {
    const proyecto = await this.proyectoRepo.findOne({ where: { id: proyectoId } });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    // Solo el creador del proyecto (admin de la empresa dueña) o el superadmin
    // pueden expulsar a un participante.
    if (user && user.rol !== 'superadmin' && proyecto.creador_id !== user.id) {
      throw new ForbiddenException('Solo el propietario del proyecto puede expulsar participantes');
    }

    if (usuarioId === proyecto.creador_id) {
      throw new BadRequestException('No se puede expulsar al propietario del proyecto');
    }

    await this.upRepo.delete({ proyecto_id: proyectoId, usuario_id: usuarioId });

    // La solicitud aceptada queda como 'rechazado': el historial es coherente y
    // el usuario expulsado puede volver a postular con una solicitud nueva.
    await this.solicitudRepo.update(
      { proyecto_id: proyectoId, usuario_id: usuarioId, estado: 'aceptado' },
      { estado: 'rechazado' },
    );

    return { message: 'Participante expulsado del proyecto' };
  }

  /**
   * Da/quita a un colaborador el acceso para crear tareas ('miembro') dentro de este
   * proyecto. Solo el creador puede usarlo, y nunca puede asignar 'admin' por acá
   * (ese nivel queda reservado para transferirPropiedad).
   */
  async updateParticipantRol(proyectoId: number, usuarioId: number, rol: string, user: any) {
    if (rol !== 'colaborador' && rol !== 'miembro') {
      throw new BadRequestException("Rol inválido: solo se puede asignar 'colaborador' o 'miembro'");
    }

    const proyecto = await this.proyectoRepo.findOne({ where: { id: proyectoId } });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    if (user.rol !== 'superadmin' && proyecto.creador_id !== user.id) {
      throw new ForbiddenException('Solo el creador del proyecto puede cambiar el acceso de los participantes');
    }

    const participante = await this.upRepo.findOne({
      where: { proyecto_id: proyectoId, usuario_id: usuarioId },
    });
    if (!participante) throw new NotFoundException('Participante no encontrado');
    if (participante.rol === 'admin') {
      throw new ForbiddenException('No se puede cambiar el rol del creador del proyecto');
    }

    participante.rol = rol;
    return this.upRepo.save(participante);
  }

  // Project join requests
  async findRequests(proyectoId: number) {
    return this.solicitudRepo.find({
      where: { proyecto_id: proyectoId },
      relations: ['usuario'],
    });
  }

  /**
   * Returns all pending join requests for every project owned by `creadorId`,
   * grouped as: { proyecto_id, proyecto_nombre, solicitudes[] }
   */
  async findPendingRequestsByOwner(creadorId: number) {
    // Find all projects created by this user
    const misProyectos = await this.proyectoRepo.find({
      where: { creador_id: creadorId },
      select: ['id', 'nombre'],
    });

    if (misProyectos.length === 0) return [];

    const proyectoIds = misProyectos.map(p => p.id);

    // Fetch all pending solicitudes for those projects in one query
    const solicitudes = await this.solicitudRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.usuario', 'u')
      .where('s.proyecto_id IN (:...ids)', { ids: proyectoIds })
      .andWhere("s.estado = 'pendiente'")
      .orderBy('s.fecha_creacion', 'DESC')
      .getMany();

    // Group by project and return only projects with at least 1 pending request
    return misProyectos
      .map(p => ({
        proyecto_id: p.id,
        proyecto_nombre: p.nombre,
        solicitudes: solicitudes.filter(s => s.proyecto_id === p.id),
      }))
      .filter(g => g.solicitudes.length > 0);
  }

  async findRequestsByUser(usuarioId: number) {
    return this.solicitudRepo.find({
      where: { usuario_id: usuarioId },
    });
  }

  async createRequest(
    proyectoId: number,
    usuarioId: number,
    datos: { mensaje?: string; propuesta?: string; propuesta_url?: string; cv_url?: string },
  ) {
    const solicitud = this.solicitudRepo.create({
      proyecto_id: proyectoId,
      usuario_id: usuarioId,
      mensaje: datos.mensaje,
      propuesta: datos.propuesta,
      propuesta_url: datos.propuesta_url,
      cv_url: datos.cv_url,
      estado: 'pendiente',
    });
    const savedSolicitud = await this.solicitudRepo.save(solicitud);

    return savedSolicitud;
  }

  async acceptRequest(solicitudId: number) {
    const solicitud = await this.solicitudRepo.findOne({
      where: { id: solicitudId },
      relations: ['usuario', 'proyecto']
    });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    solicitud.estado = 'aceptado';
    await this.solicitudRepo.save(solicitud);

    // Add user as participant
    await this.addParticipant(solicitud.proyecto_id, solicitud.usuario_id);

    // Si quien postuló es un usuario independiente (sin empresa), al ser
    // aceptado pasa a rol 'colaborador' y queda activo, pero NO se une a la
    // empresa dueña del proyecto: sigue siendo externo y puede colaborar en
    // proyectos de cualquier empresa. Los usuarios que ya pertenecen a una
    // empresa (tienen empresa_id) no se tocan: siguen en su empresa de origen.
    if (
      solicitud.usuario &&
      !solicitud.usuario.empresa_id &&
      solicitud.usuario.rol === 'empleado'
    ) {
      await this.usuarioRepo.update(solicitud.usuario_id, {
        rol: 'colaborador',
        estado: 'activo',
      });
    }

    return solicitud;
  }

  async rejectRequest(solicitudId: number) {
    const solicitud = await this.solicitudRepo.findOne({
      where: { id: solicitudId },
      relations: ['usuario', 'proyecto']
    });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    solicitud.estado = 'rechazado';
    const saved = await this.solicitudRepo.save(solicitud);

    return saved;
  }

  async updateEstado(
    proyectoId: number,
    nuevoEstado: 'en_curso' | 'terminado' | 'archivado',
    user: any,
  ) {
    const proyecto = await this.proyectoRepo.findOne({
      where: { id: proyectoId },
    });

    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    // Only superadmin or project owner can change estado
    if (user.rol !== 'superadmin' && proyecto.creador_id !== user.id) {
      throw new Error('No tienes permiso para cambiar el estado de este proyecto');
    }

    proyecto.estado = nuevoEstado;
    return this.proyectoRepo.save(proyecto);
  }

  async transferirPropiedad(proyectoId: number, nuevoCreadorId: number, user: any) {
    const proyecto = await this.proyectoRepo.findOne({
      where: { id: proyectoId },
    });

    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    if (user.rol !== 'superadmin' && user.rol !== 'admin') {
      throw new ForbiddenException('No tienes permiso para transferir este proyecto');
    }

    proyecto.creador_id = nuevoCreadorId;
    proyecto.suspendido = false;

    // Asegurarse de que el nuevo creador esté como participante administrador
    await this.addParticipant(proyectoId, nuevoCreadorId, 'admin');

    return this.proyectoRepo.save(proyecto);
  }

  /**
   * Automatically marks projects as 'terminado' if fecha_fin has passed
   * and they are still 'en_curso'. Called from a scheduled task or on demand.
   */
  async autoTerminarProyectos() {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.proyectoRepo
      .createQueryBuilder()
      .update()
      .set({ estado: 'terminado' as any })
      .where('estado = :estado', { estado: 'en_curso' })
      .andWhere('fecha_fin IS NOT NULL')
      .andWhere('fecha_fin < :today', { today })
      .execute();
    return { actualizados: result.affected ?? 0 };
  }
}
