import { Alpine } from '../../packages/alpinejs/src/alpine';
import { Window } from 'happy-dom';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const alpine = readFile(join('tests', 'dist', 'alpinejs.js'), 'utf-8');

export const render = async (
  prep: string | ((alpine: typeof Alpine) => void),
  html: string
): Promise<Window> => {
  const window = new Window();
  window.document.body.innerHTML = html;
  window.eval(await alpine);
  if (typeof prep === 'string') window.eval(prep);
  else window.Alpine.plugin(prep);
  await window.happyDOM.whenAsyncComplete();
  window.Alpine.start();
  return window;
};
