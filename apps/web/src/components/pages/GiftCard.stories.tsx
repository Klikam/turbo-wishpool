import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { mockGift } from '@/mocks/fixtures';
import GiftCard from './GiftCard';

const meta: Meta<typeof GiftCard> = {
  title: 'Pages/GiftCard',
  component: GiftCard,
  parameters: { layout: 'centered' },
  args: {
    guestToken: 'guest-token-me',
    onClaim: fn(),
    onUnclaim: fn(),
    onDelete: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GuestUnclaimed: Story = {
  args: { gift: mockGift(), isOwner: false },
};

export const GuestClaimedByMe: Story = {
  args: {
    // '4d73f641' is storageHelper.hashToken('guest-token-me'), matching the
    // meta-level guestToken arg so this gift renders as "claimed by me".
    gift: mockGift({ claimed: true, claimedByHash: '4d73f641' }),
    isOwner: false,
  },
};

export const GuestClaimedBySomeoneElse: Story = {
  args: {
    gift: mockGift({ claimed: true, claimedByHash: 'someone-else-hash' }),
    isOwner: false,
  },
};

export const OwnerView: Story = {
  args: { gift: mockGift(), isOwner: true },
};

export const OwnerViewClaimed: Story = {
  args: {
    gift: mockGift({ claimed: true, claimedByHash: 'someone-else-hash' }),
    isOwner: true,
  },
};

export const MinimalGift: Story = {
  args: {
    gift: mockGift({ description: '', price: '', url: '' }),
    isOwner: false,
  },
};
