import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { compare, hash } from 'bcrypt';
import type { Database } from '../drizzle/drizzle.provider';
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationsTable,
} from '../db/schema';

const BCRYPT_ROUNDS = 10;

interface OAuthCredentials {
  clientId?: string;
  clientSecret?: string;
}

export interface AuthConfig {
  /** Public origin of the web app. OAuth redirect URIs are `${webUrl}/api/auth/callback/<provider>`. */
  webUrl: string;
  secret: string;
  google: OAuthCredentials;
  facebook: OAuthCredentials;
  sendVerificationEmail: (email: { to: string; url: string }) => void;
}

/** Only enables a provider when both of its credentials are configured. */
function provider({ clientId, clientSecret }: OAuthCredentials) {
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
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
    advanced: { database: { generateId: 'serial' } },
    emailAndPassword: {
      enabled: true,
      // Nobody can sign in with a password until they have proven they own
      // the email address.
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 8,
      maxPasswordLength: 64,
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
    socialProviders: {
      google: provider(config.google),
      facebook: provider(config.facebook),
    },
    // A social login whose email matches an existing user is linked to that
    // user instead of creating a second account. Linking needs both sides to
    // vouch for the address: the existing user must have verified it (so an
    // unverified password sign-up can't capture a later social login) and the
    // provider must report it as verified. Facebook doesn't report that, so
    // it is deliberately not a trusted provider.
    account: {
      accountLinking: {
        enabled: true,
        requireLocalEmailVerified: true,
        trustedProviders: ['google'],
      },
    },
    // Lets server-side calls from the web app authenticate with
    // `Authorization: Bearer <session token>`.
    plugins: [bearer()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
