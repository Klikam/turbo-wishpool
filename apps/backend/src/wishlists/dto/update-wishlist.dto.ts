import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  CreateWishlistDto,
  toUpperCase,
  WISHLIST_MESSAGES,
} from './create-wishlist.dto';

// Optional fields may be sent as null to clear them. `title` and `currency`
// can't be cleared, so unlike `@IsOptional()` (which lets null through) only
// `undefined` skips their validation.
export class UpdateWishlistDto extends PartialType(
  OmitType(CreateWishlistDto, ['title', 'currency'] as const),
) {
  @ValidateIf((_, value) => value !== undefined)
  @IsString(WISHLIST_MESSAGES.titleRequired)
  @IsNotEmpty(WISHLIST_MESSAGES.titleRequired)
  @MaxLength(255, WISHLIST_MESSAGES.titleTooLong)
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(toUpperCase)
  @IsISO4217CurrencyCode(WISHLIST_MESSAGES.currency)
  currency?: string;
}
