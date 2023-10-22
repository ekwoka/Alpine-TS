import type { PluginOption } from 'vite';

export const accessOwnSources = () => {
  return {
    name: 'access-own-package-sources',
    enforce: 'pre' as const,
    apply: 'serve', // Runs only for tests and in dev
    resolveId(id: string) {
      if (
        (id.startsWith('@alpinets') || id.startsWith('alpinets')) &&
        !id.endsWith('src')
      ) {
        return {
          id: `${id}/src`,
          external: false,
        };
      }
    },
  } satisfies PluginOption;
};
