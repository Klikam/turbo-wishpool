import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: Database,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, createUserDto.email));

    console.log(user);

    if (user && user.length > 0)
      throw new ConflictException(
        `User with email ${createUserDto.email} already existed.`,
      );

    const newUser = await this.db
      .insert(usersTable)
      .values({
        ...createUserDto,
        password: await hash(createUserDto.password, 10),
      })
      .returning();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = newUser.pop()!;

    return result;
  }

  async findAll() {
    return `This action returns all user`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
