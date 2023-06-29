import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { brotliCompressSync } from 'node:zlib';
import prettyBytes from 'pretty-bytes';

const packages = ['alpinejs'];

const bundleCode = async (pkg) => {
  const { outputFiles } = await build({
    entryPoints: [`./packages/${pkg}/src/index.js`],
    inject: [],
    write: false,
    splitting: false,
    format: 'esm',
    bundle: true,
    target: 'esnext',
    platform: 'browser',
    minify: true,
    plugins: [],
    mainFields: ['module', 'main'],
  });
  console.log(getSizes(outputFiles[0].contents));
  const { minified, brotli } = getSizes(outputFiles[0].contents);
  console.log(`${pkg}: Bundle: ${minified.pretty}, Brotli: ${brotli.pretty}`);
  return {
    minified,
    brotli,
  };
};

const sizeInfo = (bytesSize) => ({
  pretty: prettyBytes(bytesSize),
  raw: bytesSize,
});

const getBytes = (str) => Buffer.byteLength(str, 'utf8');

const getSizes = (code) => {
  const minifiedSize = getBytes(code);
  const brotliSize = getBytes(brotliCompressSync(code));

  return { minified: sizeInfo(minifiedSize), brotli: sizeInfo(brotliSize) };
};

const bundleData = await Promise.all(
  packages.map(async (pkg) => [pkg, await bundleCode(pkg)])
);
const content = JSON.stringify(Object.fromEntries(bundleData), null, 2);
await writeFile(join('size.json'), content, 'utf8');
