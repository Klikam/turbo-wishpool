import type { Preview } from '@storybook/nextjs';
import { Figtree, Playfair_Display } from 'next/font/google';
import { mswLoader } from 'msw-storybook-addon/csf3';
import '../src/app/globals.css';
import { withMockData } from './decorators';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-playfair-display',
});

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      options: {
        light: { name: 'light', value: '#faf7f2' },
        dark: { name: 'dark', value: '#1c1015' },
      },
    },
    a11y: {
      test: 'todo',
    },
    // Without this, @storybook/nextjs never initializes its next/navigation
    // mocks (it defaults to Pages Router's next/router) and any component
    // calling useRouter() from next/navigation throws
    // "router mocks ... not created yet". This app is App Router only.
    nextjs: {
      appDirectory: true,
    },
  },

  loaders: [mswLoader()],

  decorators: [
    withMockData,
    (Story) => (
      <div className={`${figtree.variable} ${playfairDisplay.variable}`}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
