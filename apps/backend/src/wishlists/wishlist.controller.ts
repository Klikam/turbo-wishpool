import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@Controller('wishlists')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateWishlistDto,
  ) {
    return await this.wishlistService.create(userId, dto);
  }

  @Get()
  async findAll(@CurrentUserId() userId: number) {
    return await this.wishlistService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUserId() userId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.wishlistService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUserId() userId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWishlistDto,
  ) {
    return await this.wishlistService.update(userId, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @CurrentUserId() userId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.wishlistService.remove(userId, id);
  }
}
