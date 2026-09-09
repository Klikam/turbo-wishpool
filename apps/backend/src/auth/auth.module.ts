import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { drizzleProvider } from '../drizzle/drizzle.provider';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserService, ...drizzleProvider, ConfigService],
})
export class AuthModule {}
