import { IsOptional, IsString, Length } from 'class-validator';

export class ReserveGiftDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Your name can be at most 100 characters' })
  name?: string;
}
