import { build } from 'esbuild';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { brotliCompressSync } from 'node:zlib';
import prettyBytes from 'pretty-bytes';

const packages = await readdir('packages');

const oldValues = JSON.parse(await readFile('size.json', 'utf8'));
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
    define: {
      'import.meta.vitest': 'false',
      'import.meta.DEBUG': 'false',
    },
    mainFields: ['module', 'main'],
  });

  const { minified, brotli } = getSizes(outputFiles[0].contents);
  const oldPkg = oldValues[pkg];
  console.log(`${pkg}:
  Bundle: ${makeMessage(oldPkg?.minified, minified)},
  Brotli: ${makeMessage(oldPkg?.brotli, brotli)}\n`);
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

const makeMessage = (old, current) => {
  if (!old) return `NEW -> ${current.pretty}`;
  const diff = current.raw - old.raw;
  if (diff === 0) return 'NO CHANGE';
  return `${old.pretty} -> ${current.pretty} (${
    diff > 0 ? '+' : '-'
  }${prettyBytes(Math.abs(diff))})`;
};

const bundleData = await Promise.all(
  packages.map(async (pkg) => [pkg, await bundleCode(pkg)]),
);
const content = JSON.stringify(Object.fromEntries(bundleData), null, 2);
await writeFile('size.json', content, 'utf8');
