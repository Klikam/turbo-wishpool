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
import { GiftService } from './gift.service';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';

@Controller('wishlists/:wishlistId/gifts')
export class GiftController {
  constructor(private readonly giftService: GiftService) {}

  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Body() dto: CreateGiftDto,
  ) {
    return await this.giftService.create(userId, wishlistId, dto);
  }

  @Get()
  async findAll(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
  ) {
    return await this.giftService.findAll(userId, wishlistId);
  }

  @Get(':id')
  async findOne(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.giftService.findOne(userId, wishlistId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGiftDto,
  ) {
    return await this.giftService.update(userId, wishlistId, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @CurrentUserId() userId: number,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.giftService.remove(userId, wishlistId, id);
  }
}
