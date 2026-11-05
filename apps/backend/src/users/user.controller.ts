import { Controller, Get, NotFoundException } from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async getMyProfile(@CurrentUserId() userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException();

    return user;
  }
}
