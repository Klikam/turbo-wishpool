import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/wishpool',
  WEB_URL: 'http://localhost:3000',
  BETTER_AUTH_SECRET: 'x'.repeat(44),
};

describe('validateEnv', () => {
  it('accepts the required settings', () => {
    expect(validateEnv(valid)).toEqual(valid);
  });

  it('lists every problem at once', () => {
    expect(() => validateEnv({ BETTER_AUTH_SECRET: 'short' })).toThrow(
      /DATABASE_URL[\s\S]*WEB_URL[\s\S]*BETTER_AUTH_SECRET/,
    );
  });

  it('treats empty values as unset', () => {
    expect(() => validateEnv({ ...valid, WEB_URL: '' })).toThrow(/WEB_URL/);
    expect(
      validateEnv({ ...valid, SMTP_HOST: '', SMTP_PORT: '' }),
    ).toBeTruthy();
  });

  it('requires SMTP credentials once SMTP_HOST is set', () => {
    expect(() =>
      validateEnv({ ...valid, SMTP_HOST: 'smtp.example.com' }),
    ).toThrow(/SMTP_USER[\s\S]*SMTP_PASS/);
  });

  it('rejects a malformed port', () => {
    expect(() => validateEnv({ ...valid, PORT: 'abc' })).toThrow(/PORT/);
  });
});
