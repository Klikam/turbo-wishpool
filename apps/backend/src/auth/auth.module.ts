import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { DrizzleModule } from '../drizzle/drizzle.module';
import {
  DrizzleAsyncProvider,
  type Database,
} from '../drizzle/drizzle.provider';
import { MailModule } from '../mail/mail.module';
import { MailService } from '../mail/mail.service';
import { createAuth } from './auth.config';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      imports: [ConfigModule, DrizzleModule, MailModule],
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
          google: {
            clientId: config.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),
          },
          facebook: {
            clientId: config.get<string>('FACEBOOK_CLIENT_ID'),
            clientSecret: config.get<string>('FACEBOOK_CLIENT_SECRET'),
          },
        }),
      }),
    }),
  ],
})
export class AuthModule {}
