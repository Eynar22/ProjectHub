import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tarea } from '../entities/tarea.entity';
import { TareaComentario } from '../entities/tarea-comentario.entity';
import { KanbanColumna } from '../entities/kanban-columna.entity';
import { Usuario } from '../entities/usuario.entity';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';

@Injectable()
export class TareaService {
  constructor(
    @InjectRepository(Tarea) private tareaRepo: Repository<Tarea>,
    @InjectRepository(TareaComentario) private comentarioRepo: Repository<TareaComentario>,
    @InjectRepository(KanbanColumna) private columnaRepo: Repository<KanbanColumna>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(UsuarioProyecto) private upRepo: Repository<UsuarioProyecto>,
  ) {}

  // Solo el creador ('admin') o un colaborador al que se le dio acceso ('miembro')
  // pueden crear tareas. El resto de las acciones del tablero (mover/editar/comentar)
  // siguen abiertas a cualquier participante, como ya funcionaba.
  private async verificarPuedeCrearTareas(proyectoId: number, usuarioId: number) {
    const participante = await this.upRepo.findOne({
      where: { proyecto_id: proyectoId, usuario_id: usuarioId },
    });
    if (!participante || (participante.rol !== 'admin' && participante.rol !== 'miembro')) {
      throw new ForbiddenException('No tienes permiso para crear tareas en este proyecto');
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private async loadUsuarios(ids: number[]): Promise<Usuario[]> {
    if (!ids || ids.length === 0) return [];
    return this.usuarioRepo.findBy({ id: In(ids) });
  }

  // ── Kanban columns ──────────────────────────────────────────────────────────
  async findColumnas(proyectoId: number) {
    // Solo metadata de la columna (id, nombre, orden). Las tarjetas se piden
    // aparte con findByProyecto y el tablero las agrupa por columna_id; cargar
    // aquí el árbol de tareas + comentarios era traer todo dos veces.
    return this.columnaRepo.find({
      where: { proyecto_id: proyectoId },
      order: { orden: 'ASC' },
    });
  }

  async createColumna(proyectoId: number, nombre: string, orden: number) {
    const columna = this.columnaRepo.create({ proyecto_id: proyectoId, nombre, orden });
    return this.columnaRepo.save(columna);
  }

  async updateColumna(id: number, data: Partial<KanbanColumna>) {
    await this.columnaRepo.update(id, data);
    return this.columnaRepo.findOne({ where: { id } });
  }

  async deleteColumna(id: number) {
    await this.columnaRepo.delete(id);
    return { message: 'Columna eliminada' };
  }

  // ── Tasks ───────────────────────────────────────────────────────────────────
  async findByProyecto(proyectoId: number) {
    // Tablero kanban: solo lo que pinta cada tarjeta (datos de la tarea + sus
    // asignados). Los comentarios NO se cargan acá — se piden por tarea al abrir
    // el detalle (findOne). Join explícito para no arrastrar `columna` ni el
    // árbol de comentarios y evitar la explosión de filas del LEFT JOIN anidado.
    //
    // Del asignado solo se selecciona id + nombre_completo: `Usuario` tiene dos
    // columnas `text` con base64 (foto_url, documento_url) que si no, viajarían
    // por cada asignado de cada tarjeta. La tarjeta solo usa la inicial.
    return this.tareaRepo
      .createQueryBuilder('tarea')
      .leftJoin('tarea.usuarios', 'usuarios')
      .addSelect(['usuarios.id', 'usuarios.nombre_completo'])
      .where('tarea.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('tarea.orden', 'ASC')
      .getMany();
  }

  async findOne(id: number) {
    // Detalle de una tarea (lo devuelven create/update y lo consume el modal).
    // De los usuarios (asignados) solo id + nombre_completo: `Usuario` tiene
    // foto_url y documento_url en base64 que si no, engordan cada respuesta.
    // Los comentarios se traen sin su autor: el front resuelve el nombre contra
    // la lista global de usuarios.
    const tarea = await this.tareaRepo
      .createQueryBuilder('tarea')
      .leftJoin('tarea.usuarios', 'usuarios')
      .addSelect(['usuarios.id', 'usuarios.nombre_completo'])
      .leftJoinAndSelect('tarea.columna', 'columna')
      .leftJoinAndSelect('tarea.comentarios', 'comentarios')
      .where('tarea.id = :id', { id })
      .orderBy('comentarios.fecha_creacion', 'ASC')
      .getOne();
    if (!tarea) throw new NotFoundException('Tarea no encontrada');
    return tarea;
  }

  async create(data: any, usuarioId: number) {
    await this.verificarPuedeCrearTareas(data.proyecto_id, usuarioId);
    const { usuario_ids, ...rest } = data;
    const tarea = this.tareaRepo.create(rest as Tarea);
    tarea.usuarios = await this.loadUsuarios(usuario_ids ?? []);
    const saved = await this.tareaRepo.save(tarea) as Tarea;
    return this.findOne(saved.id);
  }

  async update(id: number, data: any) {
    const { usuario_ids, ...rest } = data;

    // Update scalar fields
    if (Object.keys(rest).length > 0) {
      await this.tareaRepo.update(id, rest);
    }

    // Update many-to-many assignees if provided
    if (usuario_ids !== undefined) {
      const tarea = await this.tareaRepo.findOne({ where: { id }, relations: ['usuarios'] });
      if (!tarea) throw new NotFoundException('Tarea no encontrada');
      tarea.usuarios = await this.loadUsuarios(usuario_ids);
      await this.tareaRepo.save(tarea);
    }

    return this.findOne(id);
  }

  async updateAsignados(id: number, usuario_ids: number[]) {
    const tarea = await this.tareaRepo.findOne({ where: { id }, relations: ['usuarios'] });
    if (!tarea) throw new NotFoundException('Tarea no encontrada');
    tarea.usuarios = await this.loadUsuarios(usuario_ids);
    await this.tareaRepo.save(tarea);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.tareaRepo.delete(id);
    return { message: 'Tarea eliminada' };
  }

  // ── Comments ────────────────────────────────────────────────────────────────
  async addComment(tareaId: number, usuarioId: number, texto: string) {
    const comentario = this.comentarioRepo.create({ tarea_id: tareaId, usuario_id: usuarioId, texto });
    // Se devuelve el comentario tal cual (sin cargar la relación `usuario`, que
    // arrastraría el base64 del perfil): el front resuelve el nombre del autor
    // contra la lista global de usuarios por usuario_id.
    return this.comentarioRepo.save(comentario);
  }

  async deleteComment(id: number) {
    await this.comentarioRepo.delete(id);
    return { message: 'Comentario eliminado' };
  }
}
