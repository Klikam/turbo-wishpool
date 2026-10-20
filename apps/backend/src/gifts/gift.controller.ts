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
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GiftService } from './gift.service';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';

@UseGuards(JwtGuard)
@Controller('wishlists/:wishlistId/gifts')
export class GiftController {
  constructor(private readonly giftService: GiftService) {}

  @Post()
  async create(
    @Request() req: ExpressRequest,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Body() dto: CreateGiftDto,
  ) {
    return await this.giftService.create(req.user!.sub, wishlistId, dto);
  }

  @Get()
  async findAll(
    @Request() req: ExpressRequest,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
  ) {
    return await this.giftService.findAll(req.user!.sub, wishlistId);
  }

  @Get(':id')
  async findOne(
    @Request() req: ExpressRequest,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.giftService.findOne(req.user!.sub, wishlistId, id);
  }

  @Patch(':id')
  async update(
    @Request() req: ExpressRequest,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGiftDto,
  ) {
    return await this.giftService.update(req.user!.sub, wishlistId, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @Request() req: ExpressRequest,
    @Param('wishlistId', ParseUUIDPipe) wishlistId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.giftService.remove(req.user!.sub, wishlistId, id);
  }
}
