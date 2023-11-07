/// <reference types="vitest" />
import { defineConfig } from 'vite';
import ExternalDeps from 'vite-plugin-external-deps';
import WorkspaceSource from 'vite-plugin-workspace-source';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), ExternalDeps(), WorkspaceSource()],
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
