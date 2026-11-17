import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CreateGiftDto } from './create-gift.dto';

// Optional fields may be sent as null to clear them. `name` can't be cleared,
// so unlike `@IsOptional()` (which lets null through) only `undefined` skips
// its validation.
export class UpdateGiftDto extends PartialType(
  OmitType(CreateGiftDto, ['name'] as const),
) {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;
}
