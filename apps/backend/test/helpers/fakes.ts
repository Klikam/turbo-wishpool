import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';
import type { MailService } from '../../src/mail/mail.service';

/** A MailService that records messages instead of sending them. */
export function fakeMail() {
  const sendInBackground = vi.fn();
  return {
    service: { send: vi.fn(), sendInBackground } as unknown as MailService,
    sendInBackground,
    /** Messages handed to the mailer, in order. */
    get sent() {
      return sendInBackground.mock.calls.map(
        ([message]) => message as { to: string; subject: string; text: string },
      );
    },
  };
}

export const fakeConfig = (env: Record<string, string> = {}) =>
  new ConfigService({ WEB_URL: 'https://wishpool.test', ...env });
