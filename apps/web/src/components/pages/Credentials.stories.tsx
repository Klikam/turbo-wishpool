import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, spyOn, userEvent, within } from 'storybook/test';
import {
  mockAuthUser,
  signInInvalidCredentials,
  signInSuccess,
  signUpEmailTaken,
  signUpSuccess,
} from '@/mocks/handlers';
import CredentialsPage from './Credentials';

/**
 * Network calls to better-auth are mocked with MSW (see
 * `src/mocks/handlers.ts`), so these stories exercise the real submit flow —
 * including the resulting success/error state — without a backend running.
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
  parameters: { msw: { handlers: [signInSuccess] } },
  play: async ({ canvasElement }) => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => undefined);
    await fillAndSubmit(
      canvasElement,
      { email: 'emma@example.com', password: 'Passw0rd!' },
      'Sign in',
    );
    await expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ email: mockAuthUser.email }),
    );
  },
};

export const SignInInvalidCredentials: Story = {
  parameters: {
    msw: { handlers: [signInInvalidCredentials] },
    docs: {
      description: {
        story:
          'CredentialsPage currently only console.logs server errors ' +
          '(see components/subpages/Credentials.tsx) — nothing renders on ' +
          'screen yet, so this story asserts on that console.log instead of ' +
          'DOM text. Open the browser console to see it.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => undefined);
    await fillAndSubmit(
      canvasElement,
      { email: 'emma@example.com', password: 'WrongPass1!' },
      'Sign in',
    );
    await expect(logSpy).toHaveBeenCalledWith('Invalid email or password');
  },
};

export const SignUpSuccess: Story = {
  parameters: { msw: { handlers: [signUpSuccess] } },
  play: async ({ canvasElement }) => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => undefined);
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Register' }),
    );
    await fillAndSubmit(
      canvasElement,
      {
        name: 'Emma Thornton',
        email: 'emma@example.com',
        password: 'Passw0rd!',
      },
      'Create account',
    );
    await expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ email: mockAuthUser.email }),
    );
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
        name: 'Emma Thornton',
        email: 'emma@example.com',
        password: 'Passw0rd!',
      },
      'Create account',
    );
    await expect(logSpy).toHaveBeenCalledWith(
      'An account with this email already exists',
    );
  },
};
