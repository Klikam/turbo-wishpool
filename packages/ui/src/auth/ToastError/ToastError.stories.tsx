import type { Meta, StoryObj } from '@storybook/react';
import { ToastError } from './ToastError';
import { NotImplementedAlert } from './NotImplementedAlert';

const meta: Meta<typeof ToastError> = {
  title: 'UI/Auth/ToastError',
  component: ToastError,
  parameters: { layout: 'centered' },
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

export const Default: Story = {
  args: { message: 'Password must contain at least 8 characters' },
};

export const LongMessage: Story = {
  args: {
    message:
      'Something went wrong with the request. Please check your details and try again.',
  },
};

export const NotImplemented: StoryObj<typeof NotImplementedAlert> = {
  render: () => <NotImplementedAlert />,
};
