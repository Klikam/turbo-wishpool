import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';

@Module({
  imports: [ConfigModule.forRoot(), DrizzleModule],
  controllers: [PublicController],
  providers: [PublicService, JwtService],
})
export class PublicModule {}
