import { noop } from './noop';
import type { Alpine } from 'alpinets';
import { ElementWithXAttributes } from 'alpinets/src/types';
import {
  CustomEvent,
  Event,
  HTMLInputElement,
  HTMLTextAreaElement,
  IKeyboardEventInit,
  InputEvent,
  KeyboardEvent,
  Window,
} from 'happy-dom';

export const render = async (
  prep:
    | string
    | ((
        alpine: Alpine,
        window: Window & { Alpine: Alpine },
      ) => void | Promise<void>) = noop,
  html = '',
): Promise<RenderReturn> => {
  const window = new Window() as Window & { Alpine: Alpine };
  window.document.body.innerHTML = html;

  Object.assign(global, {
    window,
    document: window.document,
    MutationObserver: window.MutationObserver.bind(window),
    Element: window.Element,
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    CustomEvent,
    getComputedStyle: window.getComputedStyle.bind(window),
  });
  const Alpine = (await import('alpinets')).default;
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
    type: async <T extends HTMLInputElement | HTMLTextAreaElement>(
      selector: string,
      value: string,
    ) => {
      const el = window.document.querySelector(selector) as unknown as T;
      (el as unknown as HTMLInputElement).value = value;
      el.dispatchEvent(new InputEvent('input'));
      await window.happyDOM.whenAsyncComplete();
      return el;
    },
    keydown: async (
      selector: string,
      key: string,
      options: IKeyboardEventInit = {},
    ) => {
      const el = window.document.querySelector(selector);
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          ...options,
        }),
      );
      el.dispatchEvent(new InputEvent('input'));
      await window.happyDOM.whenAsyncComplete();
    },
    getData: (selector?: string, key?: string) => {
      const el = Alpine.closestRoot(
        window.document.querySelector(
          selector ?? '[x-data]',
        ) as unknown as ElementWithXAttributes,
      );

      return key ? el?._x_dataStack[0][key] : el?._x_dataStack;
    },
    setData: (
      key: string | string[],
      value: unknown | ((data: unknown) => void),
      selector?: string,
    ) => {
      if (typeof key === 'string') key = key.split('.');
      const el = Alpine.closestRoot(
        window.document.querySelector(
          selector ?? '[x-data]',
        ) as unknown as ElementWithXAttributes,
      );

      const data = Alpine.mergeProxies(el._x_dataStack);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let target: any = data;
      while (key.length > 1) target = target?.[key.shift() as string];
      if (typeof value === 'function') value(target[key[0]]);
      else target[key[0]] = value;
      return window.happyDOM.whenAsyncComplete();
    },
    resetForm: (selector: string) => {
      const el = window.document.querySelector(selector);
      el.querySelectorAll('input').forEach(
        (input) =>
          ((input as unknown as HTMLInputElement).value =
            input.getAttribute('value') || ''),
      );
      el.dispatchEvent(new Event('reset'));
      return window.happyDOM.whenAsyncComplete();
    },
  };
};

type RenderReturn = {
  Alpine: Alpine;
  window: Window & { Alpine: Alpine };
  $: typeof window.document.querySelector;
  $$: typeof window.document.querySelectorAll;
  happyDOM: Window['happyDOM'];
  click: (selector: string) => Promise<void>;
  type: <T extends HTMLInputElement | HTMLTextAreaElement>(
    selector: string,
    value: string,
  ) => Promise<T>;
  keydown: (
    selector: string,
    key: string,
    options?: IKeyboardEventInit,
  ) => Promise<void>;
  getData: (selector?: string, key?: string) => unknown;
  setData: (
    key: string | string[],
    value: unknown | ((data: unknown) => void),
    selector?: string,
  ) => Promise<void>;
  resetForm: (selector: string) => Promise<void>;
};
