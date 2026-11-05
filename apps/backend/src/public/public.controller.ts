import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { PublicService } from './public.service';
import { ReserveGiftDto } from './dto/reserve-gift.dto';

// Visitors may be anonymous, but a token that is sent is still validated.
@OptionalAuth()
@Controller('public/wishlists/:wishlistId')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  async getWishlist(
    @CurrentUserId() userId: number | undefined,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
  ) {
    const viewer = this.publicService.resolveViewer(userId, guestToken);
    return await this.publicService.getWishlist(wishlistId, viewer);
  }

  @Put('gifts/:id/reservation')
  async reserve(
    @CurrentUserId() userId: number | undefined,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReserveGiftDto,
  ) {
    const viewer = this.publicService.resolveViewer(userId, guestToken);
    return await this.publicService.reserve(wishlistId, id, viewer, dto.name);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('gifts/:id/reservation')
  async cancelReservation(
    @CurrentUserId() userId: number | undefined,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const viewer = this.publicService.resolveViewer(userId, guestToken);
    await this.publicService.cancelReservation(wishlistId, id, viewer);
  }
}
