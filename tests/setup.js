import { build } from 'esbuild';

const packages = ['alpinejs'];

const bundleCode = (pkg) =>
  build({
    entryPoints: [`./tests/packages/${pkg}.ts`],
    inject: [],
    outfile: `tests/dist/${pkg}.js`,
    write: true,
    splitting: false,
    format: 'iife',
    bundle: true,
    target: 'esnext',
    platform: 'browser',
    minify: true,
    watch: false,
    plugins: [],
    mainFields: ['module', 'main'],
  });

packages.forEach(async (pkg) => [pkg, await bundleCode(pkg)]);
