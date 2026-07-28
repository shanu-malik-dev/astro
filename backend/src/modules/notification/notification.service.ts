import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmailNotification(input: SendEmailInput) {
    try {
      
      const host = this.configService.get<string>('SMTP_HOST');
      const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
      const user = this.configService.get<string>('SMTP_USER');
      const pass = this.configService.get<string>('SMTP_PASS');
  
      if (!host || !user || !pass) {
        this.logger.warn('SMTP configuration is missing. Email was skipped.');
        return;
      }
  
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
        auth: { user, pass },
      });
      const from = this.configService.get<string>(
        'NOTIFICATION_FROM_EMAIL',
        user,
      );
  
      await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
    } catch (error) {
      throw error;
    }
  }
}
