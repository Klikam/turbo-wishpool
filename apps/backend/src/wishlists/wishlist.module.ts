import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [ConfigModule.forRoot(), DrizzleModule],
  controllers: [WishlistController],
  providers: [WishlistService, JwtService],
})
export class WishlistModule {}
