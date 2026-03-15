import { MailerService } from '@nestjs-modules/mailer';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailJob } from './mail.service';

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process('send-mail')
  async handleSendMail(job: Job<MailJob>) {
    const { to, subject, title, message } = job.data;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #5B4FCF;">JobBoard</h2>
            <h3>${title}</h3>
            <p>${message}</p>
            <p style="color: #666; font-size: 12px;">
              Este es un email automático, no respondas a este mensaje.
            </p>
          </div>
        `,
      });
      this.logger.log(`Email enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando email a ${to}`, error);
      throw error;
    }
  }
}
