import {
  Controller,
  Get,
  NotFoundException,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { UserService } from './user.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  async getMyProfile(@Request() req: ExpressRequest) {
    const [user] = await this.userService.findByIdNoPassword(req.user!.sub);
    if (!user) throw new NotFoundException();

    return user;
  }
}
