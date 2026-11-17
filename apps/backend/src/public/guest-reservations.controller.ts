import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { PublicService } from './public.service';

// Requires a session: reservations are adopted by the signed-in user.
@Controller('public/guest-reservations')
export class GuestReservationsController {
  constructor(private readonly publicService: PublicService) {}

  @HttpCode(HttpStatus.OK)
  @Post('adopt')
  async adopt(
    @CurrentUserId() userId: number,
    @Headers('x-guest-token') guestToken: string | undefined,
  ) {
    if (!guestToken) throw new BadRequestException('Guest token is required');

    return await this.publicService.adoptGuestReservations(userId, guestToken);
  }
}
