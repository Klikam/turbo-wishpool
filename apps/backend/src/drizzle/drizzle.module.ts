import { Module } from '@nestjs/common';
import { drizzleProvider, DrizzleAsyncProvider } from './drizzle.provider';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [...drizzleProvider, ConfigService],
  exports: [DrizzleAsyncProvider],
})
export class DrizzleModule {}
