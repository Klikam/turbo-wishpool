import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { MailService } from './mail.service';
import { ReservationNoticeService } from './reservation-notices.service';

@Module({
  imports: [DrizzleModule],
  providers: [MailService, ReservationNoticeService],
  exports: [MailService, ReservationNoticeService],
})
export class MailModule {}
