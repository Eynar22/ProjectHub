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

  async sendRecoveryCode(correo: string, codigo: string) {
    const from = this.configService.get<string>('SMTP_FROM') || 'ProjectHub <no-reply@projecthub.com>';
    const subject = 'Código de recuperación de contraseña';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Recuperación de contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña en ProjectHub.</p>
        <p>Tu código de verificación es:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #f3f4f6; padding: 16px; border-radius: 8px;">${codigo}</p>
        <p>Este código expira en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(`[EMAIL SIMULADO] Código de recuperación para ${correo}: ${codigo}`);
      return;
    }

    await this.transporter.sendMail({ from, to: correo, subject, html });
  }
}
