import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [DrizzleModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
