import { describe, expect, it } from 'vitest';
import { messagesFor } from '../../../test/helpers/pipe';
import {
  CreateGiftRequestDto,
  RespondToGiftRequestDto,
} from './gift-request.dto';

describe('gift request DTOs', () => {
  it.each(['release', 'share'])('accepts a "%s" request', async (type) => {
    expect(await messagesFor(CreateGiftRequestDto, { type })).toEqual([]);
  });

  it.each([{}, { type: 'steal' }, { type: 1 }, { type: 'share', extra: true }])(
    'rejects the request %j',
    async (body) => {
      expect(await messagesFor(CreateGiftRequestDto, body)).not.toEqual([]);
    },
  );

  it('needs a real boolean to answer a request', async () => {
    expect(
      await messagesFor(RespondToGiftRequestDto, { accept: true }),
    ).toEqual([]);
    expect(
      await messagesFor(RespondToGiftRequestDto, { accept: false }),
    ).toEqual([]);
    expect(
      await messagesFor(RespondToGiftRequestDto, { accept: 'yes' }),
    ).not.toEqual([]);
    expect(await messagesFor(RespondToGiftRequestDto, {})).not.toEqual([]);
  });
});
