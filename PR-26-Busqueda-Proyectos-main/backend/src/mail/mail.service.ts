import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.configService.get<string>('SMTP_PORT') || 587),
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'SMTP no configurado (faltan SMTP_HOST/SMTP_USER/SMTP_PASS). Los correos se registrarán en consola en vez de enviarse.',
      );
    }
  }

  private async send(to: string, subject: string, html: string, simulatedLog: string) {
    const from = this.configService.get<string>('SMTP_FROM') || 'ProjectHub <no-reply@projecthub.com>';

    if (!this.transporter) {
      this.logger.log(simulatedLog);
      return;
    }

    await this.transporter.sendMail({ from, to, subject, html });
  }

  async sendRecoveryCode(correo: string, codigo: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Recuperación de contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña en ProjectHub.</p>
        <p>Tu código de verificación es:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #f3f4f6; padding: 16px; border-radius: 8px;">${codigo}</p>
        <p>Este código expira en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `;

    await this.send(
      correo,
      'Código de recuperación de contraseña',
      html,
      `[EMAIL SIMULADO] Código de recuperación para ${correo}: ${codigo}`,
    );
  }

  async sendWelcomeEmployee(correo: string, nombreCompleto: string, passwordTemporal: string, empresaNombre?: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">¡Bienvenido a ProjectHub!</h2>
        <p>Hola ${nombreCompleto},</p>
        <p>${empresaNombre ? `El administrador de <strong>${empresaNombre}</strong> te` : 'Te'} agregó a ProjectHub. Esta es tu cuenta de acceso:</p>
        <p style="margin: 4px 0;"><strong>Correo:</strong> ${correo}</p>
        <p style="margin: 4px 0;"><strong>Contraseña temporal:</strong></p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; background: #f3f4f6; padding: 16px; border-radius: 8px;">${passwordTemporal}</p>
        <p>Por seguridad, al iniciar sesión por primera vez se te pedirá cambiarla de inmediato.</p>
      </div>
    `;

    await this.send(
      correo,
      'Bienvenido a ProjectHub — tu cuenta ha sido creada',
      html,
      `[EMAIL SIMULADO] Bienvenida para ${correo} (${nombreCompleto}) — contraseña temporal: ${passwordTemporal}`,
    );
  }
}
