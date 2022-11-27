import { Alpine as AlpineType } from '../../packages/alpinejs/src/alpine';
import { Window, CustomEvent } from 'happy-dom';

globlaThis.CustomEvent = CustomEvent

export const render = async (
  prep:
    | string
    | ((alpine: AlpineType, window: Window & { Alpine: AlpineType }) => void),
  html: string
): Promise<RenderReturn> => {
  const window = new Window() as Window & { Alpine: AlpineType };
  window.document.body.innerHTML = html;
  Object.assign(global, {
    window,
    document: window.document,
    MutationObserver: window.MutationObserver.bind(window),
    Element: window.Element,
  });
  const Alpine = (await import('../../packages/alpinejs/src')).default;
  Object.assign(global, { Alpine });
  window.Alpine = Alpine;
  if (typeof prep === 'string') window.eval(prep);
  else prep(Alpine, window);
  Alpine.start();
  await window.happyDOM.whenAsyncComplete();
  return {
    Alpine,
    window,
    $: window.document.querySelector.bind(window.document),
    $$: window.document.querySelectorAll.bind(window.document),
    happyDOM: window.happyDOM,
    click: async (selector: string) => {
      window.document.querySelector(selector).click();
      await window.happyDOM.whenAsyncComplete();
    },
  };
};

type RenderReturn = {
  Alpine: AlpineType;
  window: Window & { Alpine: AlpineType };
  $: typeof window.document.querySelector;
  $$: typeof window.document.querySelectorAll;
  happyDOM: Window['happyDOM'];
  click: (selector: string) => Promise<void>;
};
