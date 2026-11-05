import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';
import {
  mockAuthUser,
  signInInvalidCredentials,
  signInSuccess,
  signUpEmailTaken,
  signUpSuccess,
} from '@/mocks/handlers';
import CredentialsPage from './CredentialsPage';

/**
 * Sign-in and registration call the better-auth endpoints from the browser,
 * which are mocked with MSW (see `src/mocks/handlers.ts`). That lets the
 * stories exercise the real submit flow without a backend running.
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
      { email: mockAuthUser.email, password: 'Passw0rd!' },
      'Sign in',
    );
    await waitFor(() =>
      expect(logSpy).toHaveBeenCalledWith(`Logged in as ${mockAuthUser.email}`),
    );
  },
};

export const SignInInvalidCredentials: Story = {
  parameters: { msw: { handlers: [signInInvalidCredentials] } },
  play: async ({ canvasElement }) => {
    await fillAndSubmit(
      canvasElement,
      { email: mockAuthUser.email, password: 'WrongPass1!' },
      'Sign in',
    );
    await expect(
      await within(canvasElement).findByText('Invalid credentials'),
    ).toBeInTheDocument();
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
          'CredentialsPage only console.logs registration errors (see ' +
          'components/pages/CredentialsPage.tsx) — nothing renders on screen ' +
          'yet, so this story asserts on that console.log instead of DOM text.',
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
    await waitFor(() =>
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('already exists'),
      ),
    );
  },
};
