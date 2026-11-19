import { IsBoolean, IsIn } from 'class-validator';

export class CreateGiftRequestDto {
  @IsIn(['release', 'share'])
  type!: 'release' | 'share';
}

export class RespondToGiftRequestDto {
  @IsBoolean()
  accept!: boolean;
}
