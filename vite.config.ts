/// <reference types="vitest" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts()],
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
    coverage: {
      provider: 'c8',
      reporter: ['text-summary', 'text', 'html'],
    },
    deps: {},
  },
});
