import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createAuth } from '../../src/auth/auth.config';
import {
  accountsTable,
  sessionsTable,
  usersTable,
  wishlistsTable,
} from '../../src/db/schema';
import { createTestDb, createWishlist } from '../helpers/db';

const WEB_URL = 'https://wishpool.test';
const PASSWORD = 'secret-pass-1';

describe('better-auth configuration (real Postgres)', () => {
  let ctx: Awaited<ReturnType<typeof createTestDb>>;
  let auth: ReturnType<typeof createAuth>;
  const verificationMails = vi.fn();
  const resetMails = vi.fn();
  const noticeMails = vi.fn();

  beforeAll(async () => {
    ctx = await createTestDb();
    auth = createAuth(ctx.db, {
      webUrl: WEB_URL,
      secret: 'a-test-secret-that-is-long-enough-for-better-auth',
      sendVerificationEmail: verificationMails,
      sendResetPasswordEmail: resetMails,
      sendEmailChangeNotice: noticeMails,
      socialProviders: {},
    });
  });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await ctx.reset();
    vi.clearAllMocks();
  });

  const bearer = (token: string) =>
    new Headers({ authorization: `Bearer ${token}` });

  async function register(email = 'ann@example.com', password = PASSWORD) {
    await auth.api.signUpEmail({ body: { name: 'Ann', email, password } });
    // As if the verification link had been opened.
    await ctx.db
      .update(usersTable)
      .set({ emailVerified: true })
      .where(eq(usersTable.email, email));
  }

  const signIn = (email = 'ann@example.com', password = PASSWORD) =>
    auth.api.signInEmail({ body: { email, password } });

  const noMailSoon = () => new Promise((resolve) => setTimeout(resolve, 100));

  describe('sign-up and verification', () => {
    it('creates a numeric-id user, hashes the password with bcrypt and sends a verification link', async () => {
      await auth.api.signUpEmail({
        body: { name: 'Ann', email: 'ann@example.com', password: PASSWORD },
      });

      const [user] = await ctx.db.select().from(usersTable);
      expect(user).toMatchObject({
        email: 'ann@example.com',
        emailVerified: false,
      });
      expect(typeof user!.id).toBe('number');
      const [account] = await ctx.db.select().from(accountsTable);
      expect(account).toMatchObject({
        providerId: 'credential',
        userId: user!.id,
      });
      expect(account!.password).toMatch(/^\$2[aby]\$10\$/);
      expect(verificationMails).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ann@example.com' }),
      );
    });

    it('does not sign anyone in until the email is verified, and sends a fresh link', async () => {
      await auth.api.signUpEmail({
        body: { name: 'Ann', email: 'ann@example.com', password: PASSWORD },
      });
      verificationMails.mockClear();

      await expect(signIn()).rejects.toMatchObject({ statusCode: 403 });

      expect(verificationMails).toHaveBeenCalledOnce();
      expect(await ctx.db.select().from(sessionsTable)).toHaveLength(0);
    });

    it.each([
      ['7 characters', 'a'.repeat(7)],
      ['65 characters', 'a'.repeat(65)],
    ])('rejects a password of %s', async (_label, password) => {
      await expect(
        auth.api.signUpEmail({
          body: { name: 'Ann', email: 'ann@example.com', password },
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('sign-in', () => {
    it('signs in a verified user and rejects a wrong password', async () => {
      await register();

      const result = await signIn();
      expect(result.token).toBeTruthy();
      expect(
        (await auth.api.getSession({ headers: bearer(result.token) }))?.user
          .email,
      ).toBe('ann@example.com');
      await expect(
        signIn('ann@example.com', 'wrong-password'),
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('accepts password hashes that predate better-auth (bcrypt)', async () => {
      await register('old@example.com', 'placeholder-1');
      await ctx.db
        .update(accountsTable)
        .set({ password: await hash('legacy-password', 10) });

      await expect(
        signIn('old@example.com', 'legacy-password'),
      ).resolves.toMatchObject({
        token: expect.any(String),
      });
    });
  });

  describe('password reset', () => {
    const requestReset = (email = 'ann@example.com') =>
      auth.api.requestPasswordReset({
        body: { email, redirectTo: `${WEB_URL}/reset-password` },
      });

    async function resetToken() {
      await requestReset();
      await vi.waitFor(() => expect(resetMails).toHaveBeenCalledOnce());
      const { to, url } = resetMails.mock.calls[0]![0] as {
        to: string;
        url: string;
      };
      expect(to).toBe('ann@example.com');
      return new URL(url).pathname.split('/').pop()!;
    }

    it('emails a link that leads back to the web app', async () => {
      await register();

      await requestReset();

      await vi.waitFor(() => expect(resetMails).toHaveBeenCalledOnce());
      const { url } = resetMails.mock.calls[0]![0] as { url: string };
      expect(url).toContain('/api/auth/reset-password/');
      expect(new URL(url).searchParams.get('callbackURL')).toBe(
        `${WEB_URL}/reset-password`,
      );
    });

    it('lets the user choose a new password with the link, once', async () => {
      await register();
      const token = await resetToken();

      await auth.api.resetPassword({
        body: { newPassword: 'brand-new-pass-2', token },
      });

      await expect(signIn('ann@example.com', PASSWORD)).rejects.toMatchObject({
        statusCode: 401,
      });
      await expect(
        signIn('ann@example.com', 'brand-new-pass-2'),
      ).resolves.toMatchObject({
        token: expect.any(String),
      });
      await expect(
        auth.api.resetPassword({
          body: { newPassword: 'another-pass-3', token },
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('signs out every existing session', async () => {
      await register();
      const { token: oldSession } = await signIn();
      const token = await resetToken();

      await auth.api.resetPassword({
        body: { newPassword: 'brand-new-pass-2', token },
      });

      expect(
        await auth.api.getSession({ headers: bearer(oldSession) }),
      ).toBeNull();
    });

    it('enforces the password length rules on the new password', async () => {
      await register();
      const token = await resetToken();

      await expect(
        auth.api.resetPassword({ body: { newPassword: 'short', token } }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects an invalid token', async () => {
      await expect(
        auth.api.resetPassword({
          body: { newPassword: 'brand-new-pass-2', token: 'bogus' },
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('answers the same for unknown addresses and sends nothing (no account enumeration)', async () => {
      const unknown = await requestReset('nobody@example.com');
      await register();
      const known = await requestReset();

      expect(unknown).toEqual(known);
      await vi.waitFor(() => expect(resetMails).toHaveBeenCalledOnce());
      expect(resetMails).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ann@example.com' }),
      );
    });

    it('sends no link to accounts without a password (social sign-in only)', async () => {
      const [user] = await ctx.db
        .insert(usersTable)
        .values({ name: 'Gus', email: 'gus@example.com', emailVerified: true })
        .returning();
      await ctx.db.insert(accountsTable).values({
        userId: user!.id,
        providerId: 'facebook',
        accountId: 'fb-1',
      });

      await requestReset('gus@example.com');
      await noMailSoon();

      expect(resetMails).not.toHaveBeenCalled();
    });
  });

  describe('changing the password', () => {
    it('needs the current password and signs the other sessions out', async () => {
      await register();
      const here = await signIn();
      const elsewhere = await signIn();

      await expect(
        auth.api.changePassword({
          body: {
            currentPassword: 'wrong-password',
            newPassword: 'brand-new-pass-2',
          },
          headers: bearer(here.token),
        }),
      ).rejects.toMatchObject({ statusCode: 400 });

      // The caller gets a fresh session (and cookie), so they stay signed in;
      // every other session is gone.
      const changed = await auth.api.changePassword({
        body: {
          currentPassword: PASSWORD,
          newPassword: 'brand-new-pass-2',
          revokeOtherSessions: true,
        },
        headers: bearer(here.token),
      });

      expect(changed.token).toBeTruthy();
      expect(
        await auth.api.getSession({ headers: bearer(changed.token!) }),
      ).not.toBeNull();
      expect(
        await auth.api.getSession({ headers: bearer(elsewhere.token) }),
      ).toBeNull();
      await expect(
        signIn('ann@example.com', 'brand-new-pass-2'),
      ).resolves.toBeDefined();
    });
  });

  describe('user names', () => {
    const nameOf = async () =>
      (await ctx.db.select().from(usersTable))[0]!.name;

    it('lets a signed-in user change their name, up to 100 characters', async () => {
      await register();
      const { token } = await signIn();

      await auth.api.updateUser({
        body: { name: 'Anna Lee' },
        headers: bearer(token),
      });
      expect(await nameOf()).toBe('Anna Lee');

      await auth.api.updateUser({
        body: { name: 'a'.repeat(100) },
        headers: bearer(token),
      });
      expect(await nameOf()).toBe('a'.repeat(100));
    });

    it.each([
      ['a single character', 'A'],
      ['only spaces', '      '],
      ['101 characters', 'a'.repeat(101)],
      // Longer than the database column: a 500 before the check existed.
      ['300 characters', 'a'.repeat(300)],
    ])('rejects %s with a 400 and keeps the old name', async (_, name) => {
      await register();
      const { token } = await signIn();

      await expect(
        auth.api.updateUser({ body: { name }, headers: bearer(token) }),
      ).rejects.toMatchObject({
        statusCode: 400,
        body: { code: 'INVALID_NAME' },
      });
      expect(await nameOf()).toBe('Ann');
    });

    it('rejects a bad name at sign-up without creating the user', async () => {
      await expect(
        auth.api.signUpEmail({
          body: {
            name: 'a'.repeat(101),
            email: 'ann@example.com',
            password: PASSWORD,
          },
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
        body: { code: 'INVALID_NAME' },
      });

      expect(await ctx.db.select().from(usersTable)).toHaveLength(0);
      expect(verificationMails).not.toHaveBeenCalled();
    });

    it('still lets other profile fields change without a name', async () => {
      await register();
      const { token } = await signIn();

      await auth.api.updateUser({
        body: { image: 'https://example.com/ann.png' },
        headers: bearer(token),
      });

      expect(await nameOf()).toBe('Ann');
    });
  });

  describe('changing the email', () => {
    const emailOf = async (name = 'Ann') =>
      (await ctx.db.select().from(usersTable)).find((u) => u.name === name)!;
    const tokenIn = (url: string) =>
      new URL(url).searchParams.get('token') as string;

    it('emails the new address and only switches once its link is opened', async () => {
      await register();
      const { token } = await signIn();
      verificationMails.mockClear();

      await auth.api.changeEmail({
        body: { newEmail: 'Anna@Example.com', callbackURL: '/account' },
        headers: bearer(token),
      });

      // The link goes to the new (lower-cased) address, nothing changed yet.
      expect(verificationMails).toHaveBeenCalledOnce();
      const mail = verificationMails.mock.calls[0]![0] as {
        to: string;
        url: string;
      };
      expect(mail.to).toBe('anna@example.com');
      expect(mail.url).toContain('callbackURL=%2Faccount');
      expect(await emailOf()).toMatchObject({
        email: 'ann@example.com',
        emailVerified: true,
      });

      await auth.api.verifyEmail({ query: { token: tokenIn(mail.url) } });

      expect(await emailOf()).toMatchObject({
        email: 'anna@example.com',
        emailVerified: true,
      });
      await expect(
        signIn('anna@example.com'),
      ).resolves.toBeDefined();
      await expect(signIn('ann@example.com')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('warns the current address that a change was requested', async () => {
      await register();
      const { token } = await signIn();

      await auth.api.changeEmail({
        body: { newEmail: 'Anna@Example.com' },
        headers: bearer(token),
      });

      expect(noticeMails).toHaveBeenCalledOnce();
      expect(noticeMails).toHaveBeenCalledWith({
        to: 'ann@example.com',
        newEmail: 'anna@example.com',
      });
    });

    it('sends no warning when the request is rejected', async () => {
      await register();
      const { token } = await signIn();

      await expect(
        auth.api.changeEmail({
          body: { newEmail: 'ann@example.com' },
          headers: bearer(token),
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
      await expect(
        auth.api.changeEmail({
          body: { newEmail: 'anna@example.com' },
          headers: new Headers(),
        }),
      ).rejects.toMatchObject({ statusCode: 401 });

      expect(noticeMails).not.toHaveBeenCalled();
    });

    it('answers the same for an address that is taken, and changes nothing', async () => {
      await register();
      await ctx.db.insert(usersTable).values({
        name: 'Bob',
        email: 'bob@example.com',
        emailVerified: true,
      });
      const { token } = await signIn();
      verificationMails.mockClear();

      await expect(
        auth.api.changeEmail({
          body: { newEmail: 'bob@example.com' },
          headers: bearer(token),
        }),
      ).resolves.toMatchObject({ status: true });
      await noMailSoon();

      expect(verificationMails).not.toHaveBeenCalled();
      expect((await emailOf()).email).toBe('ann@example.com');
      expect((await emailOf('Bob')).email).toBe('bob@example.com');
    });

    it.each([
      ['the current address', 'ann@example.com'],
      ['something that is not an address', 'not-an-email'],
      // Longer than the database column: a 500 before the check existed.
      ['an address over 255 characters', `${'a'.repeat(250)}@example.com`],
    ])('rejects %s with a 400', async (_, newEmail) => {
      await register();
      const { token } = await signIn();
      verificationMails.mockClear();

      await expect(
        auth.api.changeEmail({ body: { newEmail }, headers: bearer(token) }),
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(verificationMails).not.toHaveBeenCalled();
      expect((await emailOf()).email).toBe('ann@example.com');
    });

    it('needs a signed-in user', async () => {
      await expect(
        auth.api.changeEmail({
          body: { newEmail: 'anna@example.com' },
          headers: new Headers(),
        }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('deleting the account', () => {
    it('needs the password and removes everything the user owns', async () => {
      await register();
      const { token, user } = await signIn();
      await createWishlist(ctx.db, Number(user.id));

      await expect(
        auth.api.deleteUser({
          body: { password: 'wrong-password' },
          headers: bearer(token),
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(await ctx.db.select().from(usersTable)).toHaveLength(1);

      await auth.api.deleteUser({
        body: { password: PASSWORD },
        headers: bearer(token),
      });

      expect(await ctx.db.select().from(usersTable)).toHaveLength(0);
      expect(await ctx.db.select().from(accountsTable)).toHaveLength(0);
      expect(await ctx.db.select().from(wishlistsTable)).toHaveLength(0);
    });
  });
});
