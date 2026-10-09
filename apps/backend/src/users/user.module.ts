import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [ConfigModule.forRoot(), DrizzleModule],
  controllers: [UserController],
  providers: [UserService, JwtService],
})
export class UserModule {}
