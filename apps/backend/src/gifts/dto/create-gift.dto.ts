import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Messages are shown to users as they are, so they name the form fields.
export const GIFT_NAME_MESSAGES = {
  required: { message: 'Enter a gift name' },
  tooLong: { message: 'The gift name can be at most 255 characters' },
};

const WEB_ADDRESS = { protocols: ['http', 'https'], require_protocol: true };

export class CreateGiftDto {
  @IsString(GIFT_NAME_MESSAGES.required)
  @IsNotEmpty(GIFT_NAME_MESSAGES.required)
  @MaxLength(255, GIFT_NAME_MESSAGES.tooLong)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'The description can be at most 2000 characters',
  })
  description?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'The price must be a number with at most 2 decimals' },
  )
  @Min(0, { message: "The price can't be negative" })
  @Max(1000000.0, { message: 'The price can be at most 1,000,000' })
  price?: number;

  @IsOptional()
  @IsUrl(WEB_ADDRESS, {
    message: "The link isn't a web address, e.g. https://shop.com/item",
  })
  @MaxLength(2048, { message: 'The link can be at most 2048 characters' })
  url?: string;

  @IsOptional()
  @IsUrl(WEB_ADDRESS, {
    message:
      "The image URL isn't a web address, e.g. https://shop.com/photo.jpg",
  })
  @MaxLength(2048, {
    message: 'The image URL can be at most 2048 characters',
  })
  imageUrl?: string;
}
