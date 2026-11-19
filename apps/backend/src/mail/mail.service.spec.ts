import type { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
// @nestjs/config is ESM-only, which Jest can't load; the service only reads
// settings, so a plain object stands in for ConfigService.
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));

const config = (env: Record<string, string>) =>
  ({
    get: (key: string) => env[key],
    getOrThrow: (key: string) => env[key],
  }) as unknown as ConfigService;

const sendMail = jest.fn();
jest.mocked(createTransport).mockReturnValue({ sendMail } as never);

const message = { to: 'guest@example.com', subject: 'Hi', text: 'Hello' };

describe('MailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses defaults for settings left empty in .env', async () => {
    const service = new MailService(
      config({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        MAIL_FROM: '',
      }),
    );
    await service.send(message);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Wishpool <no-reply@localhost>' }),
    );
  });

  it('uses the configured sender and port', async () => {
    const service = new MailService(
      config({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '465',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        MAIL_FROM: 'Wishpool <hello@wishpool.app>',
      }),
    );
    await service.send(message);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Wishpool <hello@wishpool.app>' }),
    );
  });
});
