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
  const listenerTarget: ElementWithXAttributes | Window | Document =
    getTarget(modifiers) ?? el;

  let handler: EventHandler = (e: Event) => callback(e);

  const options = {
    passive: modifiers.includes('passive'),
    capture: modifiers.includes('capture'),
  };

  const moddedEvent = modifyEvent(event, modifiers);
  if (modifiers.includes('prevent'))
    handler = wrapHandler(handler, preventWrapper);
  if (modifiers.includes('stop')) handler = wrapHandler(handler, stopWrapper);
  if (modifiers.includes('self')) handler = wrapHandler(handler, selfWrapper);

  if (modifiers.includes('away') || modifiers.includes('outside')) {
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
    const wait = Number(nextModifier.split('ms')[0]) || 250;

    handler = debounce(handler, wait);
  }

  if (modifiers.includes('throttle')) {
    const nextModifier =
      modifiers[modifiers.indexOf('throttle') + 1] || 'invalid-limit';
    const limit = Number(nextModifier.split('ms')[0]) || 250;

    handler = throttle(handler, limit);
  }

  listenerTarget.addEventListener(moddedEvent, handler, options);

  return () => {
    listenerTarget.removeEventListener(moddedEvent, handler, options);
  };
};

type EventHandler = (event: Event) => void;

export const isNumeric = (subject: unknown): subject is number =>
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

const documentModifiers = ['document', 'away', 'outside'];

const eventStringMods = {
  dot: dotSyntax,
  camel: camelCase,
};

const modifyEvent = (event: string, modifiers: string[]): string => {
  for (const modifier of modifiers)
    event = eventStringMods[modifier]?.(event) ?? event;
  return event;
};

const getTarget = (modifiers: string[]): Window | Document | null => {
  for (const modifier of modifiers)
    if (documentModifiers.includes(modifier)) return document;
    else if (modifier === 'window') return window;
  return null;
};

type HandlerWrapper = (next: EventHandler, event: Event) => void;
// This little helper allows us to add functionality to the listener's
// handler more flexibly in a "middleware" style.
const wrapHandler =
  (callback: EventHandler, wrapper: HandlerWrapper): EventHandler =>
  (e) =>
    wrapper(callback, e);

const preventWrapper: HandlerWrapper = (next, e) => {
  e.preventDefault();
  next(e);
};

const stopWrapper: HandlerWrapper = (next, e) => {
  e.stopPropagation();
  next(e);
};

const selfWrapper: HandlerWrapper = (next, e) => {
  e.target === e.currentTarget && next(e);
};
