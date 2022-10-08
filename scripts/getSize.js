import { build } from 'esbuild';
import { gzipSize } from 'gzip-size';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import prettyBytes from 'pretty-bytes';

const test = process.env.NODE_ENV === 'test';
build({
  entryPoints: ['./dist/index.js'],
  inject: [],
  outfile: 'testing/bundle.js',
  write: test,
  splitting: false,
  format: 'esm',
  bundle: true,
  target: 'esnext',
  platform: 'browser',
  minify: true,
  watch: false,
  plugins: [],
  mainFields: ['module', 'main'],
}).then(async ({ outputFiles }) => {
  if (test) return;
  const { minified, gzipped } = await getSizes(outputFiles[0].contents);
  const content = JSON.stringify(
    {
      minified,
      gzipped,
    },
    null,
    2
  );
  await writeFile(join('size.json'), content, 'utf8');
  console.log(`New Package size: ${minified.pretty}`);
  console.log(`Minzipped size: ${gzipped.pretty}`);
});

function sizeInfo(bytesSize) {
  return {
    pretty: prettyBytes(bytesSize),
    raw: bytesSize,
  };
}

function getBytes(str) {
  return Buffer.byteLength(str, 'utf8');
}

async function getSizes(code) {
  const minifiedSize = getBytes(code);
  const gzippedSize = await gzipSize(code);

  return { minified: sizeInfo(minifiedSize), gzipped: sizeInfo(gzippedSize) };
}
