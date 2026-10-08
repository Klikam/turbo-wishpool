import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { GiftsModule } from './gifts/gifts.module';
import { GiftModule } from './gift/gift.module';

@Module({
  imports: [ConfigModule.forRoot(), DrizzleModule, UserModule, AuthModule, WishlistModule, GiftsModule, GiftModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
