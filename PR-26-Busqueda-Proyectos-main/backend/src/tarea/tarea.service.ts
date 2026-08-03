import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tarea } from '../entities/tarea.entity';
import { TareaComentario } from '../entities/tarea-comentario.entity';
import { KanbanColumna } from '../entities/kanban-columna.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class TareaService {
  constructor(
    @InjectRepository(Tarea) private tareaRepo: Repository<Tarea>,
    @InjectRepository(TareaComentario) private comentarioRepo: Repository<TareaComentario>,
    @InjectRepository(KanbanColumna) private columnaRepo: Repository<KanbanColumna>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────
  private tareaRelations = ['usuarios', 'columna', 'comentarios', 'comentarios.usuario'];

  private async loadUsuarios(ids: number[]): Promise<Usuario[]> {
    if (!ids || ids.length === 0) return [];
    return this.usuarioRepo.findBy({ id: In(ids) });
  }

  // ── Kanban columns ──────────────────────────────────────────────────────────
  async findColumnas(proyectoId: number) {
    return this.columnaRepo.find({
      where: { proyecto_id: proyectoId },
      relations: ['tareas', 'tareas.usuarios', 'tareas.comentarios', 'tareas.comentarios.usuario'],
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
    return this.tareaRepo.find({
      where: { proyecto_id: proyectoId },
      relations: this.tareaRelations,
      order: { orden: 'ASC' },
    });
  }

  async findOne(id: number) {
    const tarea = await this.tareaRepo.findOne({
      where: { id },
      relations: this.tareaRelations,
    });
    if (!tarea) throw new NotFoundException('Tarea no encontrada');
    return tarea;
  }

  async create(data: any) {
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
    const saved = await this.comentarioRepo.save(comentario);
    return this.comentarioRepo.findOne({ where: { id: saved.id }, relations: ['usuario'] });
  }

  async deleteComment(id: number) {
    await this.comentarioRepo.delete(id);
    return { message: 'Comentario eliminado' };
  }
}
