import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { CreateGiftDto, GIFT_NAME_MESSAGES } from './create-gift.dto';

// Optional fields may be sent as null to clear them. `name` can't be cleared,
// so unlike `@IsOptional()` (which lets null through) only `undefined` skips
// its validation.
export class UpdateGiftDto extends PartialType(
  OmitType(CreateGiftDto, ['name'] as const),
) {
  @ValidateIf((_, value) => value !== undefined)
  @MaxLength(255, GIFT_NAME_MESSAGES.tooLong)
  @IsNotEmpty(GIFT_NAME_MESSAGES.required)
  @IsString(GIFT_NAME_MESSAGES.required)
  name?: string;
}
