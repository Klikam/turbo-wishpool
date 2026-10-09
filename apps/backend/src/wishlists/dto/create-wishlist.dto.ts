import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { occasionEnum } from '../../db/schema';

export type Occasion = (typeof occasionEnum.enumValues)[number];

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
}
