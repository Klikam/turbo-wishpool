import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserService } from '../users/user.service';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RefreshJwtGuard } from './guards/refresh.guard';

const AUTH_RATE_LIMIT = { limit: 5, ttl: 60_000 };

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: AUTH_RATE_LIMIT })
  @Post('register')
  async registerUser(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      ...AUTH_RATE_LIMIT,
      getTracker: (req: Record<string, unknown>) =>
        `login:${String((req.body as { email?: unknown } | undefined)?.email).toLowerCase()}`,
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @UseGuards(RefreshJwtGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshToken(@Request() req: ExpressRequest) {
    return await this.authService.refreshToken(req.refreshSession!);
  }

  @UseGuards(RefreshJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Request() req: ExpressRequest) {
    await this.authService.logout(req.refreshSession!);
  }
}
