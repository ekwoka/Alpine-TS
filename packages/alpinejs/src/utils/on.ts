import { ElementWithXAttributes } from '../types';
import { debounce } from './debounce';
import { camelCase, dotSyntax, kebabCase } from './stringTransformers';
import { throttle } from './throttle';

export const on = (
  el: ElementWithXAttributes,
  event: string,
  modifiers: string[],
  callback: EventHandler
) => {
  let listenerTarget: ElementWithXAttributes | Window | Document = el;

  let handler: EventHandler = (e: Event) => callback(e);

  const options = {
    passive: false,
    capture: false,
  };

  // This little helper allows us to add functionality to the listener's
  // handler more flexibly in a "middleware" style.
  const wrapHandler =
    (
      callback: EventHandler,
      wrapper: (next: EventHandler, event: Event) => void
    ): EventHandler =>
    (e) =>
      wrapper(callback, e);

  if (modifiers.includes('dot')) event = dotSyntax(event);
  if (modifiers.includes('camel')) event = camelCase(event);
  if (modifiers.includes('passive')) options.passive = true;
  if (modifiers.includes('capture')) options.capture = true;
  if (modifiers.includes('window')) listenerTarget = window;
  if (modifiers.includes('document')) listenerTarget = document;
  if (modifiers.includes('prevent'))
    handler = wrapHandler(handler, (next, e) => {
      e.preventDefault();
      next(e);
    });
  if (modifiers.includes('stop'))
    handler = wrapHandler(handler, (next, e) => {
      e.stopPropagation();
      next(e);
    });
  if (modifiers.includes('self'))
    handler = wrapHandler(handler, (next, e) => {
      e.target === el && next(e);
    });

  if (modifiers.includes('away') || modifiers.includes('outside')) {
    listenerTarget = document;

    handler = wrapHandler(handler, (next, e) => {
      if (el.contains(e.target as Node)) return;

      if ((e.target as Node).isConnected === false) return;

      if (el.offsetWidth < 1 && el.offsetHeight < 1) return;

      // Additional check for special implementations like x-collapse
      // where the element doesn't have display: none
      if (el._x_isShown === false) return;

      next(e);
    });
  }

  if (modifiers.includes('once')) {
    handler = wrapHandler(handler, (next, e) => {
      next(e);

      listenerTarget.removeEventListener(event, handler, options);
    });
  }

  // Handle :keydown and :keyup listeners.
  handler = wrapHandler(handler, (next, e) => {
    if (isKeyEvent(event)) {
      if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
        return;
      }
    }

    next(e);
  });

  if (modifiers.includes('debounce')) {
    const nextModifier =
      modifiers[modifiers.indexOf('debounce') + 1] || 'invalid-wait';
    const wait = isNumeric(nextModifier.split('ms')[0])
      ? Number(nextModifier.split('ms')[0])
      : 250;

    handler = debounce(handler, wait);
  }

  if (modifiers.includes('throttle')) {
    const nextModifier =
      modifiers[modifiers.indexOf('throttle') + 1] || 'invalid-limit';
    const limit = isNumeric(nextModifier.split('ms')[0])
      ? Number(nextModifier.split('ms')[0])
      : 250;

    handler = throttle(handler, limit);
  }

  listenerTarget.addEventListener(event, handler, options);

  return () => {
    listenerTarget.removeEventListener(event, handler, options);
  };
};

type EventHandler = (event: Event) => void;

const isNumeric = (subject: string | number | unknown[]) =>
  !Array.isArray(subject) && !isNaN(Number(subject));

const isKeyEvent = (event: string): event is 'keydown' | 'keyup' =>
  ['keydown', 'keyup'].includes(event);

const isListeningForASpecificKeyThatHasntBeenPressed = (
  e: Event,
  modifiers: string[]
) => {
  let keyModifiers = modifiers.filter(
    (mod) => !['window', 'document', 'prevent', 'stop', 'once'].includes(mod)
  );

  if (keyModifiers.includes('debounce')) {
    const debounceIndex = keyModifiers.indexOf('debounce');
    keyModifiers.splice(
      debounceIndex,
      isNumeric(
        (keyModifiers[debounceIndex + 1] || 'invalid-wait').split('ms')[0]
      )
        ? 2
        : 1
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
    keyModifiers.includes(modifier)
  );

  keyModifiers = keyModifiers.filter(
    (i) => !selectedSystemKeyModifiers.includes(i)
  );

  if (selectedSystemKeyModifiers.length > 0) {
    const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter(
      (modifier) => {
        // Alias "cmd" and "super" to "meta"
        if (modifier === 'cmd' || modifier === 'super') modifier = 'meta';

        return e[`${modifier}Key`];
      }
    );

    // If all the modifiers selected are pressed, ...
    if (
      activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length
    ) {
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
    space: '-',
    spacebar: '-',
    cmd: 'meta',
    esc: 'escape',
    up: 'arrow-up',
    down: 'arrow-down',
    left: 'arrow-left',
    right: 'arrow-right',
    period: '.',
    equal: '=',
  };

  modifierToKeyMap[key] = key;

  return Object.entries(modifierToKeyMap)
    .map(([modifier, keytype]) => (keytype === key ? modifier : false))
    .filter((mod: string | false): mod is string => Boolean(mod));
};
