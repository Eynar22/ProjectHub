import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { SolicitudMembresia } from '../entities/solicitud-membresia.entity';
import { Proyecto } from '../entities/proyecto.entity';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(SolicitudMembresia) private solicitudRepo: Repository<SolicitudMembresia>,
    @InjectRepository(Proyecto) private proyectoRepo: Repository<Proyecto>,
  ) {}

  async findAll() {
    return this.usuarioRepo.find({ relations: ['empresa'] });
  }

  async findByEmpresa(empresaId: number) {
    return this.usuarioRepo.find({
      where: { empresa_id: empresaId },
      relations: ['empresa'],
    });
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id },
      relations: ['empresa'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async update(id: number, data: Partial<Usuario>) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.usuarioRepo.update(id, data);
    return this.findOne(id);
  }

  async promoteToAdmin(id: number) {
    return this.update(id, { rol: 'admin' } as any);
  }

  async demoteToEmpleado(id: number) {
    return this.update(id, { rol: 'empleado' } as any);
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);
    await this.usuarioRepo.remove(usuario);
    return { message: 'Usuario eliminado' };
  }

  async blockUser(id: number) {
    const usuario = await this.findOne(id);

    // If admin, check they are not the only active admin in the company
    if (usuario.rol === 'admin' && usuario.empresa_id) {
      const activeAdmins = await this.usuarioRepo.count({
        where: { empresa_id: usuario.empresa_id, rol: 'admin', estado: 'activo' },
      });
      if (activeAdmins <= 1) {
        throw new BadRequestException(
          'No puedes bloquear al único admin activo de la empresa. Asigna otro admin primero.'
        );
      }
    }

    // Block the user
    await this.usuarioRepo.update(id, { estado: 'bloqueado' } as any);

    // Suspend projects
    await this.proyectoRepo.update({ creador_id: id }, { suspendido: true });

    return { message: 'Usuario bloqueado exitosamente y proyectos suspendidos' };
  }

  async unblockUser(id: number) {
    const usuario = await this.findOne(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    await this.usuarioRepo.update(id, { estado: 'activo' } as any);

    // Unsuspend projects
    await this.proyectoRepo.update({ creador_id: id }, { suspendido: false });

    return { message: 'Usuario desbloqueado exitosamente y proyectos reactivados' };
  }

  // Membership requests management
  async findMembershipRequests(empresaId: number) {
    return this.solicitudRepo.find({
      where: { empresa_id: empresaId },
      relations: ['usuario'],
    });
  }

  async approveMembership(solicitudId: number) {
    const solicitud = await this.solicitudRepo.findOne({
      where: { id: solicitudId },
      relations: ['usuario', 'usuario.empresa'],
    });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    solicitud.estado = 'aprobado';
    await this.solicitudRepo.save(solicitud);

    // Activate the user
    await this.usuarioRepo.update(solicitud.usuario_id, { estado: 'activo' });



    return solicitud;
  }

  async rejectMembership(solicitudId: number) {
    const solicitud = await this.solicitudRepo.findOne({
      where: { id: solicitudId },
      relations: ['usuario', 'usuario.empresa'],
    });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    solicitud.estado = 'rechazado';
    await this.solicitudRepo.save(solicitud);

    // Update user to rechazado instead of leaving them pending
    await this.usuarioRepo.update(solicitud.usuario_id, { estado: 'rechazado' });



    return solicitud;
  }

  async deleteMembership(solicitudId: number) {
    const solicitud = await this.solicitudRepo.findOne({ where: { id: solicitudId } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    // Also delete the user
    await this.usuarioRepo.delete(solicitud.usuario_id);
    await this.solicitudRepo.remove(solicitud);

    return { message: 'Solicitud y usuario eliminados' };
  }
}
