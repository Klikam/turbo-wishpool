import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { Mode } from '@repo/types';
import { CredentialsButton } from './CredentialsButton';

const meta: Meta<typeof CredentialsButton> = {
  title: 'UI/Auth/CredentialsButton',
  component: CredentialsButton,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignInActive: Story = {
  args: { label: 'Sign in', mode: 'signin', handleModeChange: () => {} },
};

export const RegisterInactive: Story = {
  args: { label: 'Register', mode: 'signin', handleModeChange: () => {} },
};

export const Toggle: Story = {
  args: { label: 'Sign in', mode: 'signin', handleModeChange: () => {} },
  render: () => {
    function ToggleDemo() {
      const [mode, setMode] = useState<Mode>('signin');
      return (
        <div className="flex rounded-xl border border-border bg-secondary p-1 w-64">
          <CredentialsButton
            label="Sign in"
            mode={mode}
            handleModeChange={() => {
              setMode('signin');
            }}
          />
          <CredentialsButton
            label="Register"
            mode={mode}
            handleModeChange={() => {
              setMode('register');
            }}
          />
        </div>
      );
    }
    return <ToggleDemo />;
  },
};
