import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../entities/usuario.entity';
import { Empresa } from '../entities/empresa.entity';
import { SolicitudMembresia } from '../entities/solicitud-membresia.entity';
import { CodigoRecuperacion } from '../entities/codigo-recuperacion.entity';
import { MailService } from '../mail/mail.service';
import {
  LoginDto,
  RegisterEmpresaDto,
  RegisterEmpleadoDto,
  RegisterIndependienteDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';

const CODIGO_EXPIRACION_MINUTOS = 15;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Empresa) private empresaRepo: Repository<Empresa>,
    @InjectRepository(SolicitudMembresia) private solicitudRepo: Repository<SolicitudMembresia>,
    @InjectRepository(CodigoRecuperacion) private codigoRepo: Repository<CodigoRecuperacion>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: { correo: dto.correo },
      select: ['id', 'nombre_completo', 'correo', 'password', 'rol', 'empresa_id', 'cargo', 'estado', 'onboarding_completado', 'debe_cambiar_password'],
      relations: ['empresa'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValid = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Check if user is blocked (Case-insensitive check)
    if (usuario.estado?.toLowerCase() === 'bloqueado') {
      throw new UnauthorizedException('Tu cuenta ha sido bloqueada temporalmente. Por favor, contacta con soporte para más información.');
    }

    // Check if user or company is rejected
    if (usuario.estado === 'rechazado' || (usuario.empresa && usuario.empresa.estado === 'rechazado')) {
      if (usuario.rol === 'admin') {
        throw new UnauthorizedException('Tu solicitud de empresa fue denegada. Los documentos y/o el perfil no coinciden con lo que esperamos en la plataforma.');
      } else {
        throw new UnauthorizedException('Tu solicitud para unirte a la empresa fue denegada por su administrador. Por favor, comunícate con ellos directamente.');
      }
    }

    // Check if user is active (not pending) - superadmins always allowed
    if (usuario.rol !== 'superadmin' && usuario.estado !== 'activo') {
      throw new UnauthorizedException('Tu cuenta aún no ha sido aprobada');
    }

    // Check if company is approved (for non-superadmins)
    if (usuario.rol !== 'superadmin' && usuario.empresa) {
      if (usuario.empresa.estado === 'bloqueado') {
        throw new UnauthorizedException(
          'El acceso a tu empresa ha sido suspendido temporalmente por el administrador de la plataforma. Por favor, contacta con soporte.'
        );
      }
      if (usuario.empresa.estado !== 'aprobado') {
        throw new UnauthorizedException('Tu empresa aún no ha sido aprobada por el administrador de la plataforma.');
      }
    }

    const payload = { sub: usuario.id, correo: usuario.correo, rol: usuario.rol };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        correo: usuario.correo,
        rol: usuario.rol,
        cargo: usuario.cargo,
        empresa_id: usuario.empresa_id,
        empresa: usuario.empresa ? { id: usuario.empresa.id, nombre: usuario.empresa.nombre } : null,
        onboarding_completado: usuario.onboarding_completado,
        debe_cambiar_password: usuario.debe_cambiar_password,
      },
    };
  }

  // Flujo B: Registrar nueva empresa + admin
  async registerEmpresa(dto: RegisterEmpresaDto) {
    const existing = await this.usuarioRepo.findOne({ where: { correo: dto.correo } });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Create empresa
    const empresa = this.empresaRepo.create({
      nombre: dto.nombre_empresa,
      descripcion: dto.descripcion,
      num_empleados: dto.num_empleados,
      portafolio: dto.portafolio,
      documento_url: dto.documento_empresa_url,
      logo_url: dto.logo_url,
      estado: 'pendiente',
    });
    const savedEmpresa = await this.empresaRepo.save(empresa);

    // Create admin user
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const usuario = this.usuarioRepo.create({
      nombre_completo: dto.nombre_completo,
      cargo: dto.cargo,
      correo: dto.correo,
      password: hashedPassword,
      documento_url: dto.documento_personal_url,
      rol: 'admin',
      empresa_id: savedEmpresa.id,
      estado: 'pendiente',
    });
    await this.usuarioRepo.save(usuario);

    return { message: 'Empresa registrada. Pendiente de aprobación por el administrador.' };
  }

  // Flujo A: Registrar empleado en empresa existente
  async registerEmpleado(dto: RegisterEmpleadoDto) {
    const existing = await this.usuarioRepo.findOne({ where: { correo: dto.correo } });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const empresa = await this.empresaRepo.findOne({ where: { id: dto.empresa_id } });
    if (!empresa || empresa.estado !== 'aprobado') {
      throw new ConflictException('La empresa no existe o no está aprobada');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const usuario = this.usuarioRepo.create({
      nombre_completo: dto.nombre_completo,
      cargo: dto.cargo,
      correo: dto.correo,
      password: hashedPassword,
      documento_url: dto.documento_url,
      rol: 'empleado',
      empresa_id: dto.empresa_id,
      estado: 'pendiente',
    });
    const savedUsuario = await this.usuarioRepo.save(usuario);

    // Create membership request
    const solicitud = this.solicitudRepo.create({
      empresa_id: dto.empresa_id,
      usuario_id: savedUsuario.id,
      documento_url: dto.documento_url,
      estado: 'pendiente',
    });
    await this.solicitudRepo.save(solicitud);

    return { message: 'Solicitud de membresía enviada. Pendiente de aprobación por el admin de la empresa.' };
  }

  // Flujo C: Registrar usuario independiente (sin empresa). No requiere
  // aprobación de nadie: queda 'activo' y puede iniciar sesión de inmediato.
  // Podrá postular a proyectos y, al ser aceptado, la empresa dueña del
  // proyecto lo absorbe como empleado.
  async registerIndependiente(dto: RegisterIndependienteDto) {
    const existing = await this.usuarioRepo.findOne({ where: { correo: dto.correo } });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const usuario = this.usuarioRepo.create({
      nombre_completo: dto.nombre_completo,
      cargo: dto.cargo,
      correo: dto.correo,
      password: hashedPassword,
      documento_url: dto.documento_url,
      rol: 'empleado',
      estado: 'activo',
    });
    await this.usuarioRepo.save(usuario);

    return { message: 'Cuenta creada. Ya puedes iniciar sesión.' };
  }

  async getProfile(userId: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId },
      relations: ['empresa'],
    });
    return usuario;
  }

  // ── Recuperación de contraseña por código enviado al correo ──────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const usuario = await this.usuarioRepo.findOne({ where: { correo: dto.correo } });

    // Respuesta genérica siempre, para no revelar si el correo existe o no.
    if (!usuario) {
      return { message: 'Si el correo está registrado, recibirás un código de verificación.' };
    }

    // Invalida cualquier código previo sin usar de este usuario.
    await this.codigoRepo.update({ usuario_id: usuario.id, usado: false }, { usado: true });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const fechaExpiracion = new Date(Date.now() + CODIGO_EXPIRACION_MINUTOS * 60 * 1000);

    const registro = this.codigoRepo.create({
      usuario_id: usuario.id,
      codigo,
      fecha_expiracion: fechaExpiracion,
      usado: false,
    });
    await this.codigoRepo.save(registro);

    await this.mailService.sendRecoveryCode(usuario.correo, codigo);

    return { message: 'Si el correo está registrado, recibirás un código de verificación.' };
  }

  private async findValidCode(correo: string, codigo: string): Promise<{ usuario: Usuario; registro: CodigoRecuperacion }> {
    const usuario = await this.usuarioRepo.findOne({
      where: { correo },
      select: ['id', 'correo', 'password'],
    });
    if (!usuario) {
      throw new BadRequestException('Código inválido o expirado');
    }

    const registro = await this.codigoRepo.findOne({
      where: { usuario_id: usuario.id, codigo, usado: false },
      order: { fecha_creacion: 'DESC' },
    });

    if (!registro || registro.fecha_expiracion.getTime() < Date.now()) {
      throw new BadRequestException('Código inválido o expirado');
    }

    return { usuario, registro };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    await this.findValidCode(dto.correo, dto.codigo);
    return { message: 'Código válido' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { usuario, registro } = await this.findValidCode(dto.correo, dto.codigo);

    const esMismaPassword = await bcrypt.compare(dto.nueva_password, usuario.password);
    if (esMismaPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    const hashedPassword = await bcrypt.hash(dto.nueva_password, 10);
    await this.usuarioRepo.update(usuario.id, { password: hashedPassword, debe_cambiar_password: false });
    await this.codigoRepo.update(registro.id, { usado: true });

    return { message: 'Contraseña actualizada correctamente' };
  }

  // ── Cambio de contraseña estando autenticado ──────────────────────────────
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const passwordValid = await bcrypt.compare(dto.password_actual, usuario.password);
    if (!passwordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const esMismaPassword = await bcrypt.compare(dto.password_nueva, usuario.password);
    if (esMismaPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    const hashedPassword = await bcrypt.hash(dto.password_nueva, 10);
    await this.usuarioRepo.update(userId, { password: hashedPassword, debe_cambiar_password: false });

    return { message: 'Contraseña actualizada correctamente' };
  }
}
