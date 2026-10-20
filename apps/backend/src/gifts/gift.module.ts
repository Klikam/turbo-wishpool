import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { GiftService } from './gift.service';
import { GiftController } from './gift.controller';

@Module({
  imports: [ConfigModule.forRoot(), DrizzleModule],
  controllers: [GiftController],
  providers: [GiftService, JwtService],
})
export class GiftModule {}
