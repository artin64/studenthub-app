import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Central place for all outgoing email (password reset, 2FA codes, approval
 * notices, etc).
 *
 * IMPORTANT — read this before deploying anywhere real:
 * Without SMTP_HOST/SMTP_USER/SMTP_PASS set in .env, this service does NOT
 * send real email. It logs the message to the server console instead, so
 * you can copy the code/link out of the terminal while developing locally.
 * That is fine for testing on your machine, but it means password resets
 * and 2FA codes are NOT actually delivered to anyone until you configure a
 * real SMTP provider (e.g. an SMTP relay from your email host, SendGrid,
 * Mailgun, Amazon SES, etc.) in the backend .env file. See .env.example.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly configured: boolean;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<string>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.fromAddress = this.config.get<string>('SMTP_FROM') ?? 'StudentHub <no-reply@studenthub.local>';

    this.configured = Boolean(host && user && pass);
    if (this.configured) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ? Number(port) : 587,
        secure: Number(port) === 465,
        auth: { user, pass },
      });
    }
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.configured || !this.transporter) {
      this.logger.warn(
        `[DEV MODE — SMTP not configured, email NOT actually sent]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, text });
    } catch (err) {
      // Never let an email-delivery failure break the underlying request
      // (e.g. registration should still succeed even if the notice email
      // bounces) — log it loudly instead so an admin can notice and fix SMTP.
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }
}
