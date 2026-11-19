import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import {
  CreateGiftRequestDto,
  RespondToGiftRequestDto,
} from './dto/gift-request.dto';
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put('gifts/:id/reservation')
  async reserve(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.publicService.reserve(wishlistId, id, userId);
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

  // Ask the people who reserved a gift to free it or to share it.
  @UseGuards(ThrottlerGuard)
  @Post('gifts/:id/requests')
  async createRequest(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateGiftRequestDto,
  ) {
    return await this.publicService.createRequest(
      wishlistId,
      id,
      userId,
      dto.type,
    );
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('gifts/:id/requests/:requestId')
  async cancelRequest(
    @CurrentUserId() userId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    await this.publicService.cancelRequest(id, requestId, userId);
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put('gifts/:id/requests/:requestId')
  async respondToRequest(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: RespondToGiftRequestDto,
  ) {
    await this.publicService.respondToRequest(
      wishlistId,
      id,
      requestId,
      userId,
      dto.accept,
    );
  }
}
