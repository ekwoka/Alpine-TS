/// <reference types="vitest" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [dts(), tsconfigPaths()],
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    minify: false,
  },
  test: {
    globals: true,
    includeSource: ['*.{spec,test}.{ts,tsx}'],
    reporters: ['dot'],
    deps: {},
  },
});
