import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';

@Module({
  imports: [ConfigModule.forRoot(), DrizzleModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
