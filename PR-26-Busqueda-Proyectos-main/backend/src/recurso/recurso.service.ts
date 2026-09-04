import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Recurso } from '../entities/recurso.entity';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';

@Injectable()
export class RecursoService {
  constructor(
    @InjectRepository(Recurso) private recursoRepo: Repository<Recurso>,
    private almacenamiento: AlmacenamientoService,
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
    // Junta las urls de este recurso y de todos sus descendientes (el CASCADE de
    // la BD borra las filas hijas pero no los archivos del disco).
    const filas: { url: string | null }[] = await this.recursoRepo.query(
      `WITH RECURSIVE sub AS (
         SELECT id, url FROM recurso WHERE id = $1
         UNION ALL
         SELECT r.id, r.url FROM recurso r JOIN sub ON r.padre_id = sub.id
       )
       SELECT url FROM sub WHERE url IS NOT NULL`,
      [id],
    );
    await this.recursoRepo.delete(id);
    await this.almacenamiento.eliminarPorUrls(filas.map((f) => f.url));
    return { message: 'Recurso eliminado' };
  }
}
