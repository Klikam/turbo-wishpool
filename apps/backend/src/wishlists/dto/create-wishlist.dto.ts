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

export class CreateWishlistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsIn(occasionEnum.enumValues)
  occasion?: Occasion;

  @IsOptional()
  @IsISO8601({ strict: true })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  /** Defaults to EUR. */
  @IsOptional()
  @Transform(toUpperCase)
  @IsISO4217CurrencyCode()
  currency?: string;
}
