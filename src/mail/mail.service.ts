import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';

export interface MailJob {
  to: string;
  subject: string;
  title: string;
  message: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue('mail')
    private readonly mailQueue: Queue,
  ) {}

  async sendApplicationNotification(
    to: string,
    jobTitle: string,
    candidateName: string,
  ) {
    await this.mailQueue.add('send-mail', {
      to,
      subject: 'Nueva aplicación recibida — JobBoard',
      title: '¡Tienes una nueva aplicación!',
      message: `${candidateName} aplicó a tu oferta "${jobTitle}". Ingresa a JobBoard para ver su perfil.`,
    } as MailJob);
  }

  async sendWelcomeEmail(to: string, name: string) {
    await this.mailQueue.add('send-mail', {
      to,
      subject: 'Bienvenido a JobBoard',
      title: `¡Hola ${name}!`,
      message:
        'Tu cuenta ha sido creada exitosamente. Ya puedes explorar las ofertas disponibles.',
    } as MailJob);
  }
}
