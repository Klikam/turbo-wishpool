import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, mocked, spyOn, userEvent, within } from 'storybook/test';
import { login } from '@/actions/auth';
import {
  mockAuthUser,
  signUpEmailTaken,
  signUpSuccess,
} from '@/mocks/handlers';
import CredentialsPage from './CredentialsPage';

/**
 * Sign-in calls the `login` server action, which is replaced by
 * `actions/__mocks__/auth.ts` in Storybook (see `.storybook/main.ts`).
 * Registration calls the backend from the browser and is mocked with MSW
 * (see `src/mocks/handlers.ts`). Together these let the stories exercise the
 * real submit flow without a backend running.
 */
const meta: Meta<typeof CredentialsPage> = {
  title: 'Pages/Credentials',
  component: CredentialsPage,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function fillAndSubmit(
  canvasElement: HTMLElement,
  fields: { name?: string; email: string; password: string },
  submitLabel: string,
) {
  const canvas = within(canvasElement);
  if (fields.name) {
    await userEvent.type(canvas.getByLabelText('Full name'), fields.name);
  }
  await userEvent.type(canvas.getByLabelText('Email'), fields.email);
  await userEvent.type(canvas.getByLabelText('Password'), fields.password);

  const form = canvasElement.querySelector('form');
  if (!form) throw new Error('form not found');
  await userEvent.click(
    within(form).getByRole('button', { name: submitLabel }),
  );
}

export const Default: Story = {};

export const SignInSuccess: Story = {
  play: async ({ canvasElement }) => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => undefined);
    await fillAndSubmit(
      canvasElement,
      { email: mockAuthUser.email, password: 'Passw0rd!' },
      'Sign in',
    );
    await expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ email: mockAuthUser.email }),
    );
    await expect(logSpy).toHaveBeenCalledWith(
      `Logged in as ${mockAuthUser.email}`,
    );
  },
};

export const SignInInvalidCredentials: Story = {
  beforeEach: () => {
    mocked(login).mockResolvedValue({
      ok: false,
      error: 'Invalid credentials',
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'CredentialsPage currently only console.logs server errors ' +
          '(see components/pages/CredentialsPage.tsx) — nothing renders on ' +
          'screen yet, so this story asserts on that console.log instead of ' +
          'DOM text. Open the browser console to see it.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => undefined);
    await fillAndSubmit(
      canvasElement,
      { email: mockAuthUser.email, password: 'WrongPass1!' },
      'Sign in',
    );
    await expect(logSpy).toHaveBeenCalledWith('Invalid credentials');
  },
};

export const SignUpSuccess: Story = {
  parameters: { msw: { handlers: [signUpSuccess] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Register' }));
    await fillAndSubmit(
      canvasElement,
      {
        name: mockAuthUser.name,
        email: mockAuthUser.email,
        password: 'Passw0rd!',
      },
      'Create account',
    );
    // A successful registration switches the form back to sign-in mode.
    await expect(canvas.queryByLabelText('Full name')).not.toBeInTheDocument();
  },
};

export const SignUpEmailTaken: Story = {
  parameters: {
    msw: { handlers: [signUpEmailTaken] },
    docs: {
      description: {
        story:
          'Same console-only error handling as SignInInvalidCredentials — ' +
          'see that story for details.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => undefined);
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Register' }),
    );
    await fillAndSubmit(
      canvasElement,
      {
        name: mockAuthUser.name,
        email: mockAuthUser.email,
        password: 'Passw0rd!',
      },
      'Create account',
    );
    await expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('already existed'),
    );
  },
};
