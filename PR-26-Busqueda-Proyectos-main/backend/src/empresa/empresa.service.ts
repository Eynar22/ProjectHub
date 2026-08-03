import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../entities/empresa.entity';
import { Usuario } from '../entities/usuario.entity';


@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa) private empresaRepo: Repository<Empresa>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
  ) {}

  async findAll() {
    return this.empresaRepo.find({ relations: ['usuarios'] });
  }

  async findApproved() {
    return this.empresaRepo.find({ where: { estado: 'aprobado' } });
  }

  async findOne(id: number) {
    const empresa = await this.empresaRepo.findOne({
      where: { id },
      relations: ['usuarios'],
    });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }

  async update(id: number, data: Partial<Empresa>) {
    await this.empresaRepo.update(id, data);
    return this.findOne(id);
  }

  async approve(id: number) {
    // Approve the company and its admin user
    const empresa = await this.findOne(id);
    empresa.estado = 'aprobado';
    empresa.fecha_aprobacion = new Date().toISOString().split('T')[0]; // Format as native Postgres Date string
    await this.empresaRepo.save(empresa);

    // Also activate the admin user
    const usuarioRepo = this.empresaRepo.manager.getRepository(Usuario);
    await usuarioRepo.update(
      { empresa_id: id, rol: 'admin' },
      { estado: 'activo' },
    );

    return empresa;
  }

  async block(id: number) {
    return this.update(id, { estado: 'bloqueado' } as any);
  }

  async unblock(id: number) {
    return this.update(id, { estado: 'aprobado' } as any);
  }

  async remove(id: number) {
    const empresa = await this.findOne(id);
    
    if (empresa.estado === 'aprobado') {
      throw new BadRequestException('No se pueden eliminar empresas aprobadas. Bloquéalas en su lugar.');
    }

    // Instead of deleting, we set state to 'rechazado' for login messages
    empresa.estado = 'rechazado';
    await this.empresaRepo.save(empresa);

    const usuarioRepo = this.empresaRepo.manager.getRepository(Usuario);
    


    // Set users to 'rechazado'
    await usuarioRepo.update(
      { empresa_id: id },
      { estado: 'rechazado' }
    );

    return { message: 'Empresa y usuarios asociados marcados como rechazados' };
  }
}
