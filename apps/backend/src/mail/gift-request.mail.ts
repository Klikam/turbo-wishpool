import type { MailMessage } from './mail.service';

export type GiftRequestType = 'release' | 'share';

interface GiftRequestMailInfo {
  /** Who receives the email. */
  to: string;
  /** The other person in the exchange: the asker, or whoever answered. */
  otherName: string;
  type: GiftRequestType;
  giftName: string;
  wishlistTitle: string;
  /** The wishlist page, where the request is answered. */
  wishlistUrl: string;
}

/** Asks a reserver to give a gift up, or to let someone chip in. */
export function giftRequestMail(info: GiftRequestMailInfo): MailMessage {
  const { otherName, giftName, wishlistTitle, wishlistUrl } = info;
  const ask =
    info.type === 'release'
      ? `would like to give "${giftName}" themselves and asks you to free it`
      : `would like to share "${giftName}" with you, so you buy it together`;
  const outcome =
    info.type === 'release'
      ? 'If you accept, your reservation moves to them and you can choose another gift.'
      : 'If you accept, they join your reservation and the price is split equally.';

  return {
    to: info.to,
    subject:
      info.type === 'release'
        ? `Someone asks you to free a gift on "${wishlistTitle}"`
        : `Someone asks to share a gift with you on "${wishlistTitle}"`,
    text: `${otherName} ${ask} (wishlist "${wishlistTitle}" on Wishpool).\n\n${outcome} If you decline, nothing changes.\n\nAnswer here: ${wishlistUrl}`,
  };
}

/** Tells the asker how the reserver answered. */
export function giftRequestAnswerMail(
  info: GiftRequestMailInfo & { accepted: boolean },
): MailMessage {
  const { otherName, giftName, wishlistTitle, wishlistUrl, accepted } = info;

  let result: string;
  if (!accepted) {
    result = `${otherName} declined your request about "${giftName}". The reservation stays as it was; you can pick another gift.`;
  } else if (info.type === 'release') {
    result = `${otherName} accepted: "${giftName}" is now reserved for you.`;
  } else {
    result = `${otherName} accepted: you now share "${giftName}" with them. The price is split equally between everyone buying it.`;
  }

  return {
    to: info.to,
    subject: `${otherName} ${accepted ? 'accepted' : 'declined'} your request on "${wishlistTitle}"`,
    text: `${result}\n\nWishlist "${wishlistTitle}": ${wishlistUrl}`,
  };
}
