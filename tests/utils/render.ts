import { Alpine as AlpineType } from '../../packages/alpinejs/src/alpine';
import { ElementWithXAttributes } from '../../packages/alpinejs/src/types';
import { noop } from './noop';
import {
  CustomEvent,
  Event,
  IKeyboardEventInit,
  InputEvent,
  KeyboardEvent,
  Window,
} from 'happy-dom';

export const render = async (
  prep:
    | string
    | ((
        alpine: AlpineType,
        window: Window & { Alpine: AlpineType }
      ) => void | Promise<void>) = noop,
  html = ''
): Promise<RenderReturn> => {
  const window = new Window() as Window & { Alpine: AlpineType };
  window.document.body.innerHTML = html;
  Object.assign(global, {
    window,
    document: window.document,
    MutationObserver: window.MutationObserver.bind(window),
    Element: window.Element,
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    CustomEvent,
  });
  const Alpine = (await import('../../packages/alpinejs/src')).default;
  Object.assign(global, { Alpine });
  window.Alpine = Alpine;
  if (typeof prep === 'string') window.eval(prep);
  else await prep(Alpine, window);
  Alpine.start();
  await window.happyDOM.whenAsyncComplete();
  return {
    Alpine,
    window,
    $: window.document.querySelector.bind(window.document),
    $$: window.document.querySelectorAll.bind(window.document),
    happyDOM: window.happyDOM,
    click: async (selector: string) => {
      (
        window.document.querySelector(selector) as unknown as HTMLElement
      ).click();
      await window.happyDOM.whenAsyncComplete();
    },
    type: async (selector: string, value: string) => {
      const el = window.document.querySelector(selector);
      (el as unknown as HTMLInputElement).value = value;
      el.dispatchEvent(new InputEvent('input'));
      await window.happyDOM.whenAsyncComplete();
    },
    keydown: async (
      selector: string,
      key: string,
      options: IKeyboardEventInit = {}
    ) => {
      const el = window.document.querySelector(selector);
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          ...options,
        })
      );
      await window.happyDOM.whenAsyncComplete();
    },
    getData: (selector?: string, key?: string) => {
      const el = Alpine.closestRoot(
        window.document.querySelector(
          selector ?? '[x-data]'
        ) as unknown as ElementWithXAttributes
      );

      return key ? el?._x_dataStack[0][key] : el?._x_dataStack;
    },
    resetForm: (selector: string) => {
      const el = window.document.querySelector(selector);
      el.querySelectorAll('input').forEach(
        (input) =>
          ((input as unknown as HTMLInputElement).value =
            input.getAttribute('value') || '')
      );
      el.dispatchEvent(new Event('reset'));
      return window.happyDOM.whenAsyncComplete();
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
  type: (selector: string, value: string) => Promise<void>;
  keydown: (
    selector: string,
    key: string,
    options?: IKeyboardEventInit
  ) => Promise<void>;
  getData: (selector?: string, key?: string) => unknown;
  resetForm: (selector: string) => Promise<void>;
};
