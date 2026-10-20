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
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { PublicService } from './public.service';
import { ReserveGiftDto } from './dto/reserve-gift.dto';

@UseGuards(OptionalJwtGuard)
@Controller('public/wishlists/:wishlistId')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  async getWishlist(
    @Request() req: ExpressRequest,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
  ) {
    const viewer = this.publicService.resolveViewer(req.user?.sub, guestToken);
    return await this.publicService.getWishlist(wishlistId, viewer);
  }

  @Put('gifts/:id/reservation')
  async reserve(
    @Request() req: ExpressRequest,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReserveGiftDto,
  ) {
    const viewer = this.publicService.resolveViewer(req.user?.sub, guestToken);
    return await this.publicService.reserve(wishlistId, id, viewer, dto.name);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('gifts/:id/reservation')
  async cancelReservation(
    @Request() req: ExpressRequest,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const viewer = this.publicService.resolveViewer(req.user?.sub, guestToken);
    await this.publicService.cancelReservation(wishlistId, id, viewer);
  }
}
