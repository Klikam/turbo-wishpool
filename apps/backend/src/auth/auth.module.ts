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
              text: `Welcome to Wishpool! Confirm your email address by opening this link:\n\n${url}\n\nIf you didn't create an account, you can ignore this email.`,
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
