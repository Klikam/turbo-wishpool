import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import type { Credentials } from '@repo/types';
import { CredentialsField } from './CredentialsField';

function CredentialsFieldDemo(
  props: Omit<React.ComponentProps<typeof CredentialsField>, 'register'>,
) {
  const { register } = useForm<Credentials>();
  return <CredentialsField {...props} register={register} />;
}

const meta: Meta<typeof CredentialsFieldDemo> = {
  title: 'UI/Auth/CredentialsField',
  component: CredentialsFieldDemo,
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

export const Email: Story = {
  args: {
    label: 'Email',
    field: 'email',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    field: 'password',
    placeholder: '••••••••',
    type: 'password',
  },
};

export const FullName: Story = {
  args: {
    label: 'Full name',
    field: 'name',
    placeholder: 'Emma Thornton',
    type: 'text',
  },
};
