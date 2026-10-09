import { Controller } from '@nestjs/common';
import { GiftService } from './gift.service';

@Controller('gifts')
export class GiftController {
  constructor(private readonly giftService: GiftService) {}
}
