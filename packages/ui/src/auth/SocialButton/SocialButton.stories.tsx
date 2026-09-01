import type { Meta, StoryObj } from '@storybook/react';
import { SocialButton } from './SocialButton';

const meta: Meta<typeof SocialButton> = {
  title: 'UI/Auth/SocialButton',
  component: SocialButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Google: Story = { args: { provider: 'google' } };
export const Apple: Story = { args: { provider: 'apple' } };
export const Facebook: Story = { args: { provider: 'facebook' } };
