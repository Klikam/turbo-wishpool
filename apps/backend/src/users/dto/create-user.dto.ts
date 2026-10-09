import {
  IsByteLength,
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 255)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Length(8, 64)
  @IsByteLength(0, 72)
  password!: string;
}
