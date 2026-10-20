import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { WishlistModule } from './wishlists/wishlist.module';
import { GiftModule } from './gifts/gift.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DrizzleModule,
    UserModule,
    AuthModule,
    WishlistModule,
    GiftModule,
    PublicModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
