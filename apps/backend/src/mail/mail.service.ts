import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Single entry point for every email the app sends (verification now,
 * notifications later). Speaks plain SMTP, so the provider (Brevo, SES, ...)
 * is only a matter of env vars. Without `SMTP_HOST` the message is logged
 * instead of sent, which keeps local development free of provider setup.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.from =
      config.get<string>('MAIL_FROM') ?? 'Wishpool <no-reply@localhost>';

    if (host) {
      const port = Number(config.get<string>('SMTP_PORT') ?? 587);
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: config.getOrThrow<string>('SMTP_USER'),
          pass: config.getOrThrow<string>('SMTP_PASS'),
        },
      });
    }
  }

  async send(message: MailMessage) {
    if (!this.transporter) {
      this.logger.log(
        `SMTP_HOST is not set, not sending.\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`,
      );
      return;
    }

    await this.transporter.sendMail({ from: this.from, ...message });
  }

  /**
   * Fire-and-forget variant for flows where awaiting the provider would leak
   * timing information (e.g. whether an email is registered) or block the
   * response. Failures are logged, never thrown.
   */
  sendInBackground(message: MailMessage) {
    this.send(message).catch((error: unknown) => {
      this.logger.error(
        `Failed to send "${message.subject}" to ${message.to}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }
}
