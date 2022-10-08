import { readdir } from 'node:fs/promises';

export const getAllTypeScript = async (paths, ext = ['.ts']) => {
  paths = paths.map((path) => (path.endsWith('/') ? path : `${path}/`));
  const files = await Promise.all(
    paths.map(async (path) => {
      const files = (await readdir(path)).map(
        (f) => `${path}${f}${f.includes('.') ? '' : '/'}`
      );
      const folders = files.filter((f) => f.endsWith('/'));
      if (folders.length) files.push(...(await getAllTypeScript(folders, ext)));
      return files;
    })
  );
  const hasValidExtension = (filename) => ext.some((e) => filename.endsWith(e));
  const isNotTest = (filename) => !filename.includes('.test.');
  return files.flat().filter((fn) => isNotTest(fn) && hasValidExtension(fn));
};
