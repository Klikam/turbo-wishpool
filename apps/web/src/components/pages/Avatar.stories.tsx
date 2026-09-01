import type { Meta, StoryObj } from '@storybook/nextjs';
import Avatar from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Pages/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { name: 'Emma Thornton', size: 'md' },
};

export const Small: Story = {
  args: { name: 'Emma Thornton', size: 'sm' },
};

export const Large: Story = {
  args: { name: 'Emma Thornton', size: 'lg' },
};

export const SingleName: Story = {
  args: { name: 'Madonna', size: 'md' },
};

export const ColorVariants: Story = {
  args: { name: 'Emma Thornton' },
  render: () => (
    <div className="flex gap-3">
      {['Emma Thornton', 'Noah Bennett', 'Ava Ramirez', 'Liam Walsh'].map(
        (name) => (
          <Avatar key={name} name={name} size="lg" />
        ),
      )}
    </div>
  ),
};
