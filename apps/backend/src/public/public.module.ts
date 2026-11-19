import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';

@Module({
  imports: [
    DrizzleModule,
    // Reservation changes per visitor IP and minute: plenty for a person,
    // too few for a script claiming every gift on a list.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
