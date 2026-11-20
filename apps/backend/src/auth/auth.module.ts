import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { DrizzleModule } from '../drizzle/drizzle.module';
import {
  DrizzleAsyncProvider,
  type Database,
} from '../drizzle/drizzle.provider';
import { MailModule } from '../mail/mail.module';
import { MailService } from '../mail/mail.service';
import { createAuth, type OAuthCredentials } from './auth.config';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      imports: [DrizzleModule, MailModule],
      inject: [ConfigService, DrizzleAsyncProvider, MailService],
      useFactory: (config: ConfigService, db: Database, mail: MailService) => ({
        auth: createAuth(db, {
          sendVerificationEmail: ({ to, url }) =>
            mail.sendInBackground({
              to,
              subject: 'Verify your email for Wishpool',
              text: `Confirm your email address for Wishpool by opening this link:\n\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
            }),
          sendResetPasswordEmail: ({ to, url }) =>
            mail.sendInBackground({
              to,
              subject: 'Reset your Wishpool password',
              text: `Someone asked to reset the password for your Wishpool account. Choose a new one by opening this link (valid for one hour):\n\n${url}\n\nIf it wasn't you, ignore this email; your password stays as it is.`,
            }),
          sendEmailChangeNotice: ({ to, newEmail }) =>
            mail.sendInBackground({
              to,
              subject: 'Your Wishpool email address is being changed',
              text: `Someone asked to change the email address of your Wishpool account to ${newEmail}. The change only happens if the link sent to that address is opened; until then nothing is different.\n\nIf it was you, there is nothing to do. If it wasn't, change your password right away (or use "Forgot password?" on the sign-in form).`,
            }),
          webUrl: config.getOrThrow<string>('WEB_URL'),
          secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
          socialProviders: {
            google: oauthCredentials(config, 'GOOGLE'),
            facebook: oauthCredentials(config, 'FACEBOOK'),
          },
        }),
      }),
    }),
  ],
})
export class AuthModule {}

function oauthCredentials(
  config: ConfigService,
  prefix: string,
): OAuthCredentials | undefined {
  const clientId = config.get<string>(`${prefix}_CLIENT_ID`);
  const clientSecret = config.get<string>(`${prefix}_CLIENT_SECRET`);
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}
