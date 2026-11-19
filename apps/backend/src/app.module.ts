import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { DrizzleModule } from './drizzle/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { WishlistModule } from './wishlists/wishlist.module';
import { GiftModule } from './gifts/gift.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    // Loaded once for the whole app; feature modules inject ConfigService.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DrizzleModule,
    AuthModule,
    WishlistModule,
    GiftModule,
    PublicModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
