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
 * (.env, .env, ...) and pass NEXT_PUBLIC_* values through explicitly.
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

  /**
   * Server actions use cookies() and server-only env vars, so they can't run
   * in the browser — swap them for their counterparts in src/actions/__mocks__/.
   *
   * This rewrites the request before resolution rather than using `sb.mock()`
   * or `resolve.alias`: Storybook's mock plugin only intercepts relative or
   * package imports, and the tsconfig-paths resolver wins over aliases for
   * the `@/` imports components use.
   */
  webpackFinal: (webpackConfig) => {
    webpackConfig.plugins ??= [];
    webpackConfig.plugins.push({
      // `webpack` types aren't resolvable from this package; type just what's used.
      apply(compiler: {
        webpack: {
          NormalModuleReplacementPlugin: new (
            pattern: RegExp,
            replace: (resource: { request: string }) => void,
          ) => { apply(compiler: unknown): void };
        };
      }) {
        new compiler.webpack.NormalModuleReplacementPlugin(
          /^@\/actions\/(auth|getUserDetails)$/,
          (resource: { request: string }) => {
            const name = resource.request.replace('@/actions/', '');
            resource.request = path.join(
              projectRoot,
              `src/actions/__mocks__/${name}.ts`,
            );
          },
        ).apply(compiler);
      },
    });
    return webpackConfig;
  },
};

export default config;
