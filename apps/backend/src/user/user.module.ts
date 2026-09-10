import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { drizzleProvider } from '../drizzle/drizzle.provider';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [UserController],
  providers: [UserService, ...drizzleProvider, JwtService],
})
export class UserModule {}
