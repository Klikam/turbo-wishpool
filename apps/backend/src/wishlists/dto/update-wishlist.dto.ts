import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CreateWishlistDto } from './create-wishlist.dto';

// Optional fields may be sent as null to clear them. `title` can't be cleared,
// so unlike `@IsOptional()` (which lets null through) only `undefined` skips
// its validation.
export class UpdateWishlistDto extends PartialType(
  OmitType(CreateWishlistDto, ['title'] as const),
) {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;
}
