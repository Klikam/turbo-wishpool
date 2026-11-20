import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Nest resolves constructor dependencies from emitted decorator metadata.
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: true } },
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', '**/*.spec.ts'],
    },
  },
});
