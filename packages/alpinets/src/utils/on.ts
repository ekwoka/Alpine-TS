import type { ElementWithXAttributes } from '../types';
import { debounce } from './debounce';
import { camelCase, dotSyntax, kebabCase } from './stringTransformers';
import { throttle } from './throttle';

const callWith =
  <T extends (ev: Event) => unknown>(ev: Event) =>
  (fn: T) =>
    fn(ev);
export const on = (
  el: ElementWithXAttributes,
  event: string,
  modifiers: string[],
  callback: EventHandler,
) => {
  const listener: ListenerInfo = {
    event,
    target: el,
    filters: [],
    handler(e) {
      const caller = callWith(e);
      if (listener.filters.every(caller)) {
        listener.cleanups.forEach(caller);
        callback(e);
      }
    },
    modifiers,
    cleanups: [],
    options: {
      passive: false,
      capture: false,
    },
  };

  for (const mod of modifiers) modifierOptions[mod]?.(listener);

  // Handle :keydown and :keyup listeners.
  if (isKeyEvent(event) || isClickEvent(event)) {
    keyedEvent(listener);
  }

  listener.target.addEventListener(
    listener.event,
    listener.handler,
    listener.options,
  );

  return () => {
    listener.target.removeEventListener(
      listener.event,
      listener.handler,
      listener.options,
    );
  };
};

type ListenerInfo = {
  event: string;
  target: ElementWithXAttributes | Window | Document;
  filters: ((e: Event) => boolean)[];
  handler(e: Event): void;
  modifiers: string[];
  cleanups: ((e: Event) => void)[];
  options: {
    passive: boolean;
    capture: boolean;
  };
};

const dot = (listener: ListenerInfo) => {
  listener.event = dotSyntax(listener.event);
  return listener;
};

const camel = (listener: ListenerInfo) => {
  listener.event = camelCase(listener.event);
  return listener;
};

const passive = (listener: ListenerInfo) => {
  listener.options.passive = true;
  return listener;
};

const capture = (listener: ListenerInfo) => {
  listener.options.capture = true;
  return listener;
};

const hasWindow = (listener: ListenerInfo) =>
  (listener.target = (listener.target as Element).ownerDocument?.defaultView);
const hasDocument = (listener: ListenerInfo) =>
  (listener.target = (listener.target as Element).ownerDocument);

const debounceListener = (listener: ListenerInfo, wait: number = 250) => {
  listener.handler = debounce(listener.handler, wait);
  return listener;
};

const throttleListener = (listener: ListenerInfo, limit: number = 250) => {
  listener.handler = throttle(listener.handler, limit);
  return listener;
};

const self = (listener: ListenerInfo) => {
  listener.filters.push(isSelf);
  return listener;
};

const isSelf = (e: Event) => e.target === e.currentTarget;

const outside = (listener: ListenerInfo) => {
  listener.filters.push(isAwayOutside.bind(null, listener.target));
  hasDocument(listener);
  return listener;
};

const once = (listener: ListenerInfo) => {
  listener.cleanups.push(() => {
    listener.target.removeEventListener(
      listener.event,
      listener.handler,
      listener.options,
    );
  });
  return listener;
};

const isAwayOutside = (el: ElementWithXAttributes, e: Event) => {
  if (el.contains(e.target as Node)) return false;

  if ((e.target as Node).isConnected === false) return false;

  if (el.offsetWidth < 1 && el.offsetHeight < 1) return false;

  // Additional check for special implementations like x-collapse
  // where the element doesn't have display: none
  if (el._x_isShown === false) return false;

  return true;
};

const hasPrevent = (listener: ListenerInfo) => listener.cleanups.push(prevent);

const hasStop = (listener: ListenerInfo) => listener.cleanups.push(stop);

const stop = (e: Event) => e.stopPropagation();

const prevent = (e: Event) => e.preventDefault();

const keyedEvent = (listener: ListenerInfo) => {
  listener.filters.push(
    (e) =>
      !isListeningForASpecificKeyThatHasntBeenPressed(e, listener.modifiers),
  );
};

type EventHandler = (event: Event) => void;

export const isNumeric = (subject: unknown): subject is number =>
  !Array.isArray(subject) && !isNaN(Number(subject));

const isKeyEvent = (event: string): event is 'keydown' | 'keyup' =>
  ['keydown', 'keyup'].includes(event);

const isClickEvent = (event: string) => {
  return ['contextmenu', 'click', 'mouse'].some((i) => event.includes(i));
};

const isListeningForASpecificKeyThatHasntBeenPressed = (
  e: Event,
  modifiers: string[],
) => {
  let keyModifiers = modifiers.filter(
    (mod) =>
      ![
        'window',
        'document',
        'prevent',
        'stop',
        'once',
        'capture',
        'self',
        'away',
        'outside',
        'passive',
      ].includes(mod),
  );

  if (keyModifiers.includes('debounce')) {
    const debounceIndex = keyModifiers.indexOf('debounce');
    keyModifiers.splice(
      debounceIndex,
      isNumeric(
        (keyModifiers[debounceIndex + 1] || 'invalid-wait').split('ms')[0],
      )
        ? 2
        : 1,
    );
  }
  if (keyModifiers.includes('throttle')) {
    const throttleIndex = keyModifiers.indexOf('throttle');
    keyModifiers.splice(
      throttleIndex,
      isNumeric(
        (keyModifiers[throttleIndex + 1] || 'invalid-wait').split('ms')[0],
      )
        ? 2
        : 1,
    );
  }

  // If no modifier is specified, we'll call it a press.
  if (keyModifiers.length === 0) return false;

  // If one is passed, AND it matches the key pressed, we'll call it a press.
  if (
    keyModifiers.length === 1 &&
    keyToModifiers((e as KeyboardEvent).key).includes(keyModifiers[0])
  )
    return false;

  // The user is listening for key combinations.
  const systemKeyModifiers = ['ctrl', 'shift', 'alt', 'meta', 'cmd', 'super'];
  const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) =>
    keyModifiers.includes(modifier),
  );

  keyModifiers = keyModifiers.filter(
    (i) => !selectedSystemKeyModifiers.includes(i),
  );

  if (selectedSystemKeyModifiers.length > 0) {
    const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter(
      (modifier) => {
        // Alias "cmd" and "super" to "meta"
        if (modifier === 'cmd' || modifier === 'super') modifier = 'meta';

        return e[`${modifier}Key`];
      },
    );

    // If all the modifiers selected are pressed, ...
    if (
      activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length
    ) {
      // AND the event is a click. It's a pass.
      if (isClickEvent(e.type)) return false;
      // AND the remaining key is pressed as well. It's a press.
      if (keyToModifiers((e as KeyboardEvent).key).includes(keyModifiers[0]))
        return false;
    }
  }

  // We'll call it NOT a valid keypress.
  return true;
};

const keyToModifiers = (key: string): string[] => {
  if (!key) return [];

  key = kebabCase(key);

  const modifierToKeyMap = {
    ctrl: 'control',
    slash: '/',
    space: ' ',
    spacebar: ' ',
    cmd: 'meta',
    esc: 'escape',
    up: 'arrow-up',
    down: 'arrow-down',
    left: 'arrow-left',
    right: 'arrow-right',
    period: '.',
    equal: '=',
    minus: '-',
    underscore: '_',
  };

  modifierToKeyMap[key] = key;

  return Object.entries(modifierToKeyMap)
    .map(([modifier, keytype]) => (keytype === key ? modifier : false))
    .filter((mod: string | false): mod is string => Boolean(mod));
};

const modifierOptions = {
  dot,
  camel,
  passive,
  capture,
  window: hasWindow,
  document: hasDocument,
  debounce: debounceListener,
  throttle: throttleListener,
  self,
  away: outside,
  outside,
  once,
  prevent: hasPrevent,
  stop: hasStop,
};
