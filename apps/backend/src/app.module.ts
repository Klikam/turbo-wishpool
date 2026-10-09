import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { WishlistModule } from './wishlists/wishlist.module';
import { GiftModule } from './gifts/gift.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DrizzleModule,
    UserModule,
    AuthModule,
    WishlistModule,
    GiftModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
