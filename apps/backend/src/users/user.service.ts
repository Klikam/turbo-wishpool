import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { User } from '@repo/types';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: Database,
  ) {}

  async findById(id: number): Promise<User | undefined> {
    const [user] = await this.db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id));

    return user;
  }
}
