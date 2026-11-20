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
  @MaxLength(255, GIFT_NAME_MESSAGES.tooLong)
  @IsNotEmpty(GIFT_NAME_MESSAGES.required)
  @IsString(GIFT_NAME_MESSAGES.required)
  name!: string;

  @IsOptional()
  @MaxLength(2000, {
    message: 'The description can be at most 2000 characters',
  })
  @IsString()
  description?: string;

  @IsOptional()
  @Max(1000000.0, { message: 'The price can be at most 1,000,000' })
  @Min(0, { message: "The price can't be negative" })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'The price must be a number with at most 2 decimals' },
  )
  price?: number;

  @IsOptional()
  @MaxLength(2048, { message: 'The link can be at most 2048 characters' })
  @IsUrl(WEB_ADDRESS, {
    message: "The link isn't a web address, e.g. https://shop.com/item",
  })
  url?: string;

  @IsOptional()
  @MaxLength(2048, {
    message: 'The image URL can be at most 2048 characters',
  })
  @IsUrl(WEB_ADDRESS, {
    message:
      "The image URL isn't a web address, e.g. https://shop.com/photo.jpg",
  })
  imageUrl?: string;
}
