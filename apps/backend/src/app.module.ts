import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [ConfigModule.forRoot(), DrizzleModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
