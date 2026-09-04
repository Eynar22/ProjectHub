import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Usuario } from '../entities/usuario.entity';
import { SolicitudMembresia } from '../entities/solicitud-membresia.entity';
import { Proyecto } from '../entities/proyecto.entity';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { MailService } from '../mail/mail.service';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';
import { QuickCreateEmpleadoDto } from './dto/usuario.dto';
import * as bcrypt from 'bcrypt';

// Caracteres sin ambigüedad visual (sin 0/O, 1/l/I) para la contraseña temporal.
const TEMP_PASSWORD_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function generateTempPassword(length = 10): string {
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += TEMP_PASSWORD_CHARSET[bytes[i] % TEMP_PASSWORD_CHARSET.length];
  }
  return password;
}

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(SolicitudMembresia) private solicitudRepo: Repository<SolicitudMembresia>,
    @InjectRepository(Proyecto) private proyectoRepo: Repository<Proyecto>,
    @InjectRepository(UsuarioProyecto) private usuarioProyectoRepo: Repository<UsuarioProyecto>,
    private mailService: MailService,
    private almacenamiento: AlmacenamientoService,
  ) {}

  // select explícito: excluye documento_url (base64) de la lista para no cargar
  // el documento de cada usuario en pantallas que no lo muestran. El detalle
  // completo (findOne) sigue trayéndolo para cuando sí se necesita.
  private static readonly LISTADO_SELECT = {
    id: true,
    nombre_completo: true,
    cargo: true,
    correo: true,
    foto_url: true,
    rol: true,
    empresa_id: true,
    fecha_registro: true,
    estado: true,
    empresa: {
      id: true,
      nombre: true,
      descripcion: true,
      num_empleados: true,
      portafolio: true,
      fecha_registro: true,
      fecha_aprobacion: true,
      estado: true,
    },
  } as const;

  async findAll() {
    return this.usuarioRepo.find({
      select: UsuarioService.LISTADO_SELECT,
      relations: ['empresa'],
    });
  }

  async findByEmpresa(empresaId: number) {
    return this.usuarioRepo.find({
      where: { empresa_id: empresaId },
      select: UsuarioService.LISTADO_SELECT,
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

  // Whitelist explícito: cualquier usuario autenticado puede editar su propio
  // perfil, pero solo estos campos — nunca rol/estado/empresa_id/password por
  // esta vía (esos tienen sus propios endpoints con permisos de admin).
  async updateSelf(
    userId: number,
    data: { nombre_completo?: string; cargo?: string; foto_url?: string; onboarding_completado?: boolean },
  ) {
    const payload: Partial<Usuario> = {};
    if (data.nombre_completo !== undefined) payload.nombre_completo = data.nombre_completo;
    if (data.cargo !== undefined) payload.cargo = data.cargo;
    if (data.foto_url !== undefined) payload.foto_url = data.foto_url;
    if (data.onboarding_completado !== undefined) payload.onboarding_completado = data.onboarding_completado;

    // Si se cambia la foto, se recuerda la anterior para borrar su archivo.
    const fotoAnterior =
      data.foto_url !== undefined
        ? (await this.usuarioRepo.findOne({ where: { id: userId }, select: { id: true, foto_url: true } }))?.foto_url
        : undefined;

    await this.usuarioRepo.update(userId, payload);

    if (fotoAnterior && fotoAnterior !== data.foto_url) {
      await this.almacenamiento.eliminarPorUrlSiHuerfano(fotoAnterior);
    }
    return this.findOne(userId);
  }

  // ── Alta rápida de empleado desde el wizard de bienvenida del admin ──────
  async quickCreateEmpleado(adminUserId: number, dto: QuickCreateEmpleadoDto) {
    const admin = await this.usuarioRepo.findOne({
      where: { id: adminUserId },
      relations: ['empresa'],
    });
    if (!admin || !admin.empresa_id) {
      throw new BadRequestException('No se pudo determinar la empresa del administrador');
    }

    const existing = await this.usuarioRepo.findOne({ where: { correo: dto.correo } });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    let proyecto: Proyecto | null = null;
    if (dto.proyecto_id) {
      proyecto = await this.proyectoRepo.findOne({ where: { id: dto.proyecto_id } });
      if (!proyecto || proyecto.creador_id !== adminUserId) {
        throw new ForbiddenException('Solo puedes agregar empleados a un proyecto que tú creaste');
      }
    }

    const passwordTemporal = generateTempPassword();
    const hashedPassword = await bcrypt.hash(passwordTemporal, 10);

    const usuario = this.usuarioRepo.create({
      nombre_completo: dto.nombre_completo,
      correo: dto.correo,
      cargo: dto.cargo,
      password: hashedPassword,
      rol: 'empleado',
      empresa_id: admin.empresa_id,
      estado: 'activo',
      debe_cambiar_password: true,
    });
    const savedUsuario = await this.usuarioRepo.save(usuario);

    if (proyecto) {
      const participante = this.usuarioProyectoRepo.create({
        usuario_id: savedUsuario.id,
        proyecto_id: proyecto.id,
        rol: 'colaborador',
      });
      await this.usuarioProyectoRepo.save(participante);
    }

    await this.mailService.sendWelcomeEmployee(
      savedUsuario.correo,
      savedUsuario.nombre_completo,
      passwordTemporal,
      admin.empresa?.nombre,
    );

    return {
      id: savedUsuario.id,
      nombre_completo: savedUsuario.nombre_completo,
      correo: savedUsuario.correo,
      cargo: savedUsuario.cargo,
    };
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
    await this.almacenamiento.eliminarPorUrlsSiHuerfanas([usuario.foto_url, usuario.documento_url]);
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
    const solicitud = await this.solicitudRepo.findOne({
      where: { id: solicitudId },
      relations: ['usuario'],
    });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    const urls = [
      solicitud.documento_url,
      solicitud.usuario?.foto_url,
      solicitud.usuario?.documento_url,
    ];

    // Also delete the user
    await this.usuarioRepo.delete(solicitud.usuario_id);
    await this.solicitudRepo.remove(solicitud);
    await this.almacenamiento.eliminarPorUrlsSiHuerfanas(urls);

    return { message: 'Solicitud y usuario eliminados' };
  }
}
