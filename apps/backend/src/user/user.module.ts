import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { drizzleProvider } from '../drizzle/drizzle.provider';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [UserController],
  providers: [UserService, ...drizzleProvider, ConfigService],
})
export class UserModule {}
