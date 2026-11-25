import { betterAuth } from 'better-auth';
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api';
import { bearer } from 'better-auth/plugins';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { compare, hash } from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import { CLIENT_IP_HEADER } from '../config/client-ip';
import type { Database } from '../drizzle/drizzle.provider';
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationsTable,
} from '../db/schema';

const BCRYPT_ROUNDS = 10;

// better-auth's own rate limit (on in production) identifies visitors by this
// header, which `stampClientIp` fills from the IP Express resolved. Reading
// `X-Forwarded-For` itself would ignore TRUST_PROXY.
export const AUTH_IP_OPTIONS = { ipAddressHeaders: [CLIENT_IP_HEADER] };

// Keep in step with `nameSchema` in @repo/types, which the web forms use.
// Without this a name longer than the database column fails with a 500.
const NAME_MIN = 2;
const NAME_MAX = 100;
const NAME_ENDPOINTS = ['/sign-up/email', '/update-user'];
// The users.email column; a longer address is a 500 instead of a 400.
const EMAIL_MAX = 255;

export interface AuthConfig {
  /** Public origin of the web app. */
  webUrl: string;
  secret: string;
  sendVerificationEmail: (email: { to: string; url: string }) => void;
  sendResetPasswordEmail: (email: { to: string; url: string }) => void;
  /**
   * Tells the current address that a change to `newEmail` was requested. The
   * confirmation link goes to the new address only, so this is how the
   * rightful owner of an account learns that someone else is moving it.
   */
  sendEmailChangeNotice: (notice: { to: string; newEmail: string }) => void;
  /** Only providers with credentials configured are offered. */
  socialProviders: {
    google?: OAuthCredentials;
    facebook?: OAuthCredentials;
  };
}

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

export function createAuth(db: Database, config: AuthConfig) {
  return betterAuth({
    baseURL: config.webUrl,
    secret: config.secret,
    trustedOrigins: [config.webUrl],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: usersTable,
        session: sessionsTable,
        account: accountsTable,
        verification: verificationsTable,
      },
    }),
    // Keeps ids numeric so they still match the integer user ids that
    // wishlists and gifts reference.
    advanced: {
      database: { generateId: 'serial' },
      ipAddress: AUTH_IP_OPTIONS,
    },
    hooks: {
      // Rejects a name or address the web forms would never send, with a 400
      // instead of a database error. Only endpoints where the user types the
      // name: social sign-in takes whatever the provider reports.
      before: createAuthMiddleware((ctx) => {
        if (ctx.path === '/change-email') {
          const { newEmail } = (ctx.body ?? {}) as { newEmail?: unknown };
          if (typeof newEmail === 'string' && newEmail.length > EMAIL_MAX) {
            throw new APIError('BAD_REQUEST', {
              code: 'INVALID_EMAIL',
              message: `Email must be at most ${EMAIL_MAX.toString()} characters`,
            });
          }
          return Promise.resolve();
        }

        if (!NAME_ENDPOINTS.includes(ctx.path)) return Promise.resolve();

        const { name } = (ctx.body ?? {}) as { name?: unknown };
        if (name === undefined) return Promise.resolve(); // e.g. image only

        const length = typeof name === 'string' ? name.trim().length : 0;
        if (length < NAME_MIN || length > NAME_MAX) {
          throw new APIError('BAD_REQUEST', {
            code: 'INVALID_NAME',
            message: `Name must be ${NAME_MIN.toString()} to ${NAME_MAX.toString()} characters`,
          });
        }
        return Promise.resolve();
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/change-email') return;
        // A rejected request (bad address, no session) changed nothing.
        if (ctx.context.returned instanceof Error) return;

        const session = await getSessionFromCtx(ctx);
        const { newEmail } = (ctx.body ?? {}) as { newEmail?: unknown };
        if (!session || typeof newEmail !== 'string') return;

        config.sendEmailChangeNotice({
          to: session.user.email,
          newEmail: newEmail.toLowerCase(),
        });
      }),
    },
    emailAndPassword: {
      enabled: true,
      // Nobody can sign in with a password until they have proven they own
      // the email address.
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 8,
      maxPasswordLength: 64,
      resetPasswordTokenExpiresIn: 60 * 60,
      // Whoever knew the old password (or had a session) is signed out.
      revokeSessionsOnPasswordReset: true,
      // Only accounts that already have a password get a link. Social-only
      // accounts don't: Facebook doesn't verify emails, so someone could
      // have pre-created an account with another person's address, and a
      // reset would hand that person a password to an account the creator
      // can still sign in to. Not awaited, for the same reason as the
      // verification email: the lookup and SMTP would reveal whether the
      // address is registered.
      sendResetPassword: ({ user, url }) => {
        void db
          .select({ id: accountsTable.id })
          .from(accountsTable)
          .where(
            and(
              eq(accountsTable.userId, Number(user.id)),
              eq(accountsTable.providerId, 'credential'),
            ),
          )
          .limit(1)
          .then(([credential]) => {
            if (credential) {
              config.sendResetPasswordEmail({ to: user.email, url });
            }
          })
          .catch((error: unknown) => {
            console.error('Password reset lookup failed', error);
          });
        return Promise.resolve();
      },
      // Keeps existing bcrypt hashes valid after the move to better-auth.
      password: {
        hash: (password) => hash(password, BCRYPT_ROUNDS),
        verify: ({ hash: passwordHash, password }) =>
          compare(password, passwordHash),
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      // Existing users were migrated as unverified, and an unverified user
      // trying to sign in gets a fresh link instead of a dead end.
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      // Not awaited on purpose: waiting for the SMTP round trip would reveal
      // whether the address is registered.
      sendVerificationEmail: ({ user, url }) => {
        config.sendVerificationEmail({ to: user.email, url });
        return Promise.resolve();
      },
    },
    // Redirect URIs to register with each provider:
    // `${webUrl}/api/auth/callback/google` and `.../callback/facebook`.
    // A social sign-in with the email of an existing account links to it
    // only when the provider has verified that email (Google does, Facebook
    // doesn't), so nobody can take over an account through Facebook.
    socialProviders: {
      ...(config.socialProviders.google && {
        google: { ...config.socialProviders.google, prompt: 'select_account' },
      }),
      ...(config.socialProviders.facebook && {
        facebook: config.socialProviders.facebook,
      }),
    },
    user: {
      // POST /api/auth/change-email. The address only changes (and counts as
      // verified) once the link emailed to the NEW address is opened, via the
      // verification email above. An address that already belongs to someone
      // gets the same answer as a free one, so it can't be used to find out
      // who has an account.
      changeEmail: { enabled: true },
      // POST /api/auth/delete-user. It needs the password, or for accounts
      // without one (social sign-in) a session from the last day. Wishlists,
      // sessions, accounts, reservations and gift requests go with the user
      // (ON DELETE CASCADE), which frees the gifts they reserved.
      deleteUser: { enabled: true },
    },
    // Lets server-side calls from the web app authenticate with
    // `Authorization: Bearer <session token>`.
    plugins: [bearer()],
  });
}
