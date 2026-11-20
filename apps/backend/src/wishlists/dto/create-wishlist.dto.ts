import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsIn,
  IsISO4217CurrencyCode,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { occasionEnum } from '../../db/schema';

export type Occasion = (typeof occasionEnum.enumValues)[number];

/** Stores currency codes as "PLN" even when sent as "pln". */
export const toUpperCase = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

// Messages are shown to users as they are, so they name the form fields.
export const WISHLIST_MESSAGES = {
  titleRequired: { message: 'Enter a title for the wishlist' },
  titleTooLong: { message: 'The title can be at most 255 characters' },
  currency: { message: 'Choose a valid currency' },
};

export class CreateWishlistDto {
  @MaxLength(255, WISHLIST_MESSAGES.titleTooLong)
  @IsNotEmpty(WISHLIST_MESSAGES.titleRequired)
  @IsString(WISHLIST_MESSAGES.titleRequired)
  title!: string;

  @IsOptional()
  @IsIn(occasionEnum.enumValues, { message: 'Choose one of the occasions' })
  occasion?: Occasion;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'Choose a valid date' })
  date?: string;

  @IsOptional()
  @MaxLength(2000, { message: 'The note can be at most 2000 characters' })
  @IsString()
  note?: string;

  /** Defaults to EUR. */
  @IsOptional()
  @Transform(toUpperCase)
  @IsISO4217CurrencyCode(WISHLIST_MESSAGES.currency)
  currency?: string;
}
