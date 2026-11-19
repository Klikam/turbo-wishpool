import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { MailModule } from '../mail/mail.module';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [DrizzleModule, MailModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
