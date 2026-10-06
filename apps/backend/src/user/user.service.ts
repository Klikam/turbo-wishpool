import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';
import { UserWithPassword, User } from '@repo/types';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: Database,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User[]> {
    const user = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, createUserDto.email));

    if (user && user.length > 0)
      throw new ConflictException(
        `User with email ${createUserDto.email} already existed.`,
      );

    const newUser = await this.db
      .insert(usersTable)
      .values({
        name: createUserDto.name,
        email: createUserDto.email,
        password: await hash(createUserDto.password, 10),
      })
      .returning();

    return newUser.map((user) => this.removePasswordFromUser(user));
  }

  async findByEmail(email: string): Promise<UserWithPassword[]> {
    return this.db.select().from(usersTable).where(eq(usersTable.email, email));
  }

  async findById(id: number): Promise<UserWithPassword[]> {
    return this.db.select().from(usersTable).where(eq(usersTable.id, id));
  }

  async findByIdNoPassword(id: number): Promise<User[]> {
    const user = await this.findById(id);
    return user.map((us) => this.removePasswordFromUser(us));
  }

  removePasswordFromUser(user: UserWithPassword): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
