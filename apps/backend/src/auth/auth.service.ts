import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';
import { UserService } from '../user/user.service';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { and, eq, gt, lt } from 'drizzle-orm';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { sessionsTable } from '../db/schema';
import {
  JwtPayload,
  RefreshJwtPayload,
} from './interfaces/jwt-payload.interface';

// 1h
const EXPIRE_TIME = 60 * 60 * 1000;
const ACCESS_TOKEN_EXPIRES_IN = '1h';

const SESSION_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRES_IN = '7d';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(DrizzleAsyncProvider)
    private db: Database,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);
    const payload: JwtPayload = { sub: user.id, email: user.email };

    await this.db
      .delete(sessionsTable)
      .where(
        and(
          eq(sessionsTable.userId, user.id),
          lt(sessionsTable.expiresAt, new Date()),
        ),
      );

    const [session] = await this.db
      .insert(sessionsTable)
      .values({
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_EXPIRE_TIME),
      })
      .returning({ id: sessionsTable.id });

    if (!session) throw new Error('Failed to create session');

    const refreshPayload: RefreshJwtPayload = { ...payload, sid: session.id };

    return {
      user,
      backendTokens: {
        accessToken: await this.signAccessToken(payload),
        refreshToken: await this.jwtService.signAsync(refreshPayload, {
          expiresIn: REFRESH_TOKEN_EXPIRES_IN,
          secret: process.env.jwtRefreshTokenKey,
        }),
        expiresAt: Date.now() + EXPIRE_TIME,
      },
    };
  }

  async validateUser(dto: LoginDto) {
    const userArr = await this.userService.findByEmail(dto.email);
    const user = userArr[0];

    if (user && (await compare(dto.password, user.password)))
      return this.userService.removePasswordFromUser(user);

    throw new UnauthorizedException('Invalid credentials');
  }

  async refreshToken({ sub, email, sid }: RefreshJwtPayload) {
    const [session] = await this.db
      .select({ id: sessionsTable.id })
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.id, sid),
          eq(sessionsTable.userId, sub),
          gt(sessionsTable.expiresAt, new Date()),
        ),
      );

    if (!session) throw new UnauthorizedException();

    return {
      accessToken: await this.signAccessToken({ sub, email }),
      expiresAt: Date.now() + EXPIRE_TIME,
    };
  }

  async logout({ sub, sid }: RefreshJwtPayload) {
    await this.db
      .delete(sessionsTable)
      .where(and(eq(sessionsTable.id, sid), eq(sessionsTable.userId, sub)));
  }

  private signAccessToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      secret: process.env.jwtSecretKey,
    });
  }
}
