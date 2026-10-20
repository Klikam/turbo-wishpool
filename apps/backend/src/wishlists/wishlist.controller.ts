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
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@UseGuards(JwtGuard)
@Controller('wishlists')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  async create(@Request() req: ExpressRequest, @Body() dto: CreateWishlistDto) {
    return await this.wishlistService.create(req.user!.sub, dto);
  }

  @Get()
  async findAll(@Request() req: ExpressRequest) {
    return await this.wishlistService.findAll(req.user!.sub);
  }

  @Get(':id')
  async findOne(
    @Request() req: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.wishlistService.findOne(req.user!.sub, id);
  }

  @Patch(':id')
  async update(
    @Request() req: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWishlistDto,
  ) {
    return await this.wishlistService.update(req.user!.sub, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @Request() req: ExpressRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.wishlistService.remove(req.user!.sub, id);
  }
}
