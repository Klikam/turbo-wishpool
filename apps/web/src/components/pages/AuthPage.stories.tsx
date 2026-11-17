import type { Meta, StoryObj } from '@storybook/nextjs';
import AuthPage from './AuthPage';

/**
 * AuthPage isn't a full page on its own — it fills the right-hand `lg:w-1/2`
 * column of LandingPage's `flex lg:flex-row` layout (see LandingPage.tsx).
 * Match that shell here so the width resolves against the viewport the same
 * way it does in production, instead of rendering artificially narrow inside
 * Storybook's default containers.
 */
const meta: Meta<typeof AuthPage> = {
  title: 'Pages/AuthPage',
  component: AuthPage,
  decorators: [
    (Story) => (
      <div className="min-h-screen flex justify-end">
        <div className="lg:w-1/2 flex flex-col">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
