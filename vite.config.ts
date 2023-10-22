/// <reference types="vitest" />
import { accessOwnSources } from './plugins/accessOwnPlugins';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), accessOwnSources()],
  build: {
    target: 'esnext',
  },
  test: {
    globals: true,
    include: ['./**/*{.spec,.test}.{ts,tsx}'],
    includeSource: ['./**/*.{ts,tsx}'],
    reporters: ['dot'],
    deps: {},
    useAtomics: true,
  },
});
