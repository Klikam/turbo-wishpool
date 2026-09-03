import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import type { StorybookConfig } from '@storybook/nextjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(dirname, '..');

/**
 * Unlike `next dev`, @storybook/nextjs does NOT load .env* files or inline
 * NEXT_PUBLIC_* vars into the bundle on its own — so without this,
 * `process.env.NEXT_PUBLIC_BACKEND_URL` is undefined at runtime in the
 * browser and `getBackendUrl()` throws. Load the same files Next.js would
 * (.env, .env.local, ...) and pass NEXT_PUBLIC_* values through explicitly.
 */
const { combinedEnv } = nextEnv.loadEnvConfig(projectRoot);
const publicEnv = Object.fromEntries(
  Object.entries(combinedEnv).filter(
    (entry): entry is [string, string] =>
      entry[0].startsWith('NEXT_PUBLIC_') && entry[1] !== undefined,
  ),
);

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    path.join(dirname, '../../../packages/ui/src/**/*.stories.@(ts|tsx)'),
  ],

  addons: [
    '@storybook/addon-a11y',
    'msw-storybook-addon',
    '@storybook/addon-docs',
    '@chromatic-com/storybook',
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {},
  },

  staticDirs: ['../public'],

  env: publicEnv,

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
