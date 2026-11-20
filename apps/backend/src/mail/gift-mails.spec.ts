import { describe, expect, it } from 'vitest';
import { giftRequestAnswerMail, giftRequestMail } from './gift-request.mail';
import { giftEditedMail, giftRemovedMail } from './gift-removed.mail';

const info = {
  to: 'ann@example.com',
  otherName: 'Bob',
  giftName: 'Lamp',
  wishlistTitle: 'Birthday',
  wishlistUrl: 'https://wishpool.test/wishlist/1',
};

describe('giftRequestMail', () => {
  it('asks the holder to free the gift', () => {
    const mail = giftRequestMail({ ...info, type: 'release' });

    expect(mail.to).toBe('ann@example.com');
    expect(mail.subject).toContain('free a gift');
    expect(mail.text).toContain('Bob would like to give "Lamp" themselves');
    expect(mail.text).toContain('your reservation moves to them');
    expect(mail.text).toContain(info.wishlistUrl);
  });

  it('asks the holder to share the gift', () => {
    const mail = giftRequestMail({ ...info, type: 'share' });

    expect(mail.subject).toContain('share a gift');
    expect(mail.text).toContain('price is split equally');
  });
});

describe('giftRequestAnswerMail', () => {
  it.each([
    ['release', 'is now reserved for you'],
    ['share', 'you now share "Lamp" with them'],
  ] as const)('tells the asker a %s was accepted', (type, phrase) => {
    const mail = giftRequestAnswerMail({ ...info, type, accepted: true });

    expect(mail.subject).toBe('Bob accepted your request on "Birthday"');
    expect(mail.text).toContain(phrase);
  });

  it('tells the asker about a refusal', () => {
    const mail = giftRequestAnswerMail({
      ...info,
      type: 'release',
      accepted: false,
    });

    expect(mail.subject).toBe('Bob declined your request on "Birthday"');
    expect(mail.text).toContain('stays as it was');
  });
});

describe('reservation notices', () => {
  const reservation = {
    to: 'ann@example.com',
    giftName: 'Lamp',
    wishlistTitle: 'Birthday',
    ownerName: 'Olga',
  };

  it('lists what changed on an edited gift', () => {
    const mail = giftEditedMail(reservation, 'Big lamp', ['name', 'price']);

    expect(mail.to).toBe('ann@example.com');
    expect(mail.text).toContain('"Big lamp"');
    expect(mail.text).toContain('What changed: name, price.');
  });

  it('says a removed gift needs no purchase', () => {
    const mail = giftRemovedMail(reservation);

    expect(mail.subject).toContain('removed from "Birthday"');
    expect(mail.text).toContain("You don't need to buy it");
  });
});
