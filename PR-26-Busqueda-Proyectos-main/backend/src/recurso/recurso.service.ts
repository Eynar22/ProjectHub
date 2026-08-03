import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Recurso } from '../entities/recurso.entity';

@Injectable()
export class RecursoService {
  constructor(
    @InjectRepository(Recurso) private recursoRepo: Repository<Recurso>,
  ) {}

  async findByProyecto(proyectoId: number) {
    return this.recursoRepo.find({
      where: { proyecto_id: proyectoId },
      order: { tipo: 'ASC', nombre: 'ASC' },
    });
  }

  async findRootByProyecto(proyectoId: number) {
    return this.recursoRepo.find({
      where: { proyecto_id: proyectoId, padre_id: IsNull() },
      order: { tipo: 'ASC', nombre: 'ASC' },
    });
  }

  async findByParent(padreId: number) {
    return this.recursoRepo.find({
      where: { padre_id: padreId },
      order: { tipo: 'ASC', nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const recurso = await this.recursoRepo.findOne({ where: { id } });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    return recurso;
  }

  async create(data: Partial<Recurso>) {
    const recurso = this.recursoRepo.create(data);
    return this.recursoRepo.save(recurso);
  }

  async update(id: number, data: Partial<Recurso>) {
    await this.recursoRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.recursoRepo.delete(id);
    return { message: 'Recurso eliminado' };
  }
}
