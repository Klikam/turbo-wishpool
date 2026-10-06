import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DrizzleModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, JwtService],
})
export class AuthModule {}
