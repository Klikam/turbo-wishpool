import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
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
  @MaxLength(255, WISHLIST_MESSAGES.titleTooLong)
  @IsNotEmpty(WISHLIST_MESSAGES.titleRequired)
  @IsString(WISHLIST_MESSAGES.titleRequired)
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(toUpperCase)
  @IsISO4217CurrencyCode(WISHLIST_MESSAGES.currency)
  currency?: string;

  /** Marks the list as past (or reopens it); see wishlist-status.ts. */
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean({ message: 'closed must be true or false' })
  closed?: boolean;
}
