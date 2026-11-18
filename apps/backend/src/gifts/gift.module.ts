import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { GiftService } from './gift.service';
import { GiftController } from './gift.controller';
import { LinkPreviewService } from './link-preview.service';

@Module({
  imports: [DrizzleModule],
  controllers: [GiftController],
  providers: [GiftService, LinkPreviewService],
})
export class GiftModule {}
