import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { PublicService } from './public.service';

// Everything here needs a signed-in user except the preview.
@Controller('public/wishlists/:wishlistId')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // What link-preview bots (which can't sign in) may see: no gifts.
  @AllowAnonymous()
  @Get('preview')
  async getPreview(@Param('wishlistId', ParseUUIDPipe) wishlistId: string) {
    return await this.publicService.getPreview(wishlistId);
  }

  @Get()
  async getWishlist(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
  ) {
    return await this.publicService.getWishlist(wishlistId, userId);
  }

  @UseGuards(ThrottlerGuard)
  @Put('gifts/:id/reservation')
  async reserve(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.publicService.reserve(wishlistId, id, userId);
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('gifts/:id/reservation')
  async cancelReservation(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.publicService.cancelReservation(wishlistId, id, userId);
  }
}
