import { deferHandlingDirectives, directives } from './directives';
import {
  cleanupAttributes,
  cleanupElement,
  onAttributesAdded,
  onElAdded,
  onElRemoved,
  startObservingMutations,
} from './mutation';
import { ElementWithXAttributes } from './types';
import { dispatch } from './utils/dispatch';
import { WalkerCallback, walk } from './utils/walk';
import { warn } from './utils/warn';

export const start = () => {
  if (!document.body)
    warn(
      "Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?",
    );

  dispatch(document, 'alpine:init');
  dispatch(document, 'alpine:initializing');

  startObservingMutations();

  onElAdded((el) => initTree(el, walk));
  onElRemoved(destroyTree);

  onAttributesAdded((el, attrs) => {
    directives(el, attrs).forEach((handle) => handle());
  });

  const outNestedComponents = (el: ElementWithXAttributes) =>
    !closestRoot(el.parentElement as ElementWithXAttributes, true);
  Array.from(document.querySelectorAll(allSelectors().join(',')))
    .filter(outNestedComponents)
    .forEach((el: ElementWithXAttributes) => {
      initTree(el);
    });

  dispatch(document, 'alpine:initialized');
};

const rootSelectorCallbacks: (() => string)[] = [];
const initSelectorCallbacks: (() => string)[] = [];

export const rootSelectors = () => rootSelectorCallbacks.map((fn) => fn());

export const allSelectors = () =>
  rootSelectorCallbacks.concat(initSelectorCallbacks).map((fn) => fn());

export const addRootSelector = (selectorCallback: () => string) =>
  rootSelectorCallbacks.push(selectorCallback);

export const addInitSelector = (selectorCallback: () => string) =>
  initSelectorCallbacks.push(selectorCallback);

export const closestRoot = (
  el: ElementWithXAttributes,
  includeInitSelectors = false,
) =>
  findClosest(el, (element) => {
    const selectors = includeInitSelectors ? allSelectors() : rootSelectors();

    if (selectors.some((selector) => element.matches(selector))) return true;
  });

export const findClosest = (
  el: ElementWithXAttributes,
  callback: (el: ElementWithXAttributes) => boolean,
): ElementWithXAttributes | null => {
  if (!el) return;

  if (callback(el)) return el;

  // Support crawling up teleports.
  if (el._x_teleportBack) el = el._x_teleportBack;

  if (!el.parentElement) return null;

  return findClosest(el.parentElement as ElementWithXAttributes, callback);
};

export const isRoot = (el: ElementWithXAttributes) =>
  rootSelectors().some((selector) => el.matches(selector));

const initInterceptors: WalkerCallback[] = [];

export const interceptInit = (callback: WalkerCallback) => {
  initInterceptors.push(callback);
};

export const initTree = (
  el: ElementWithXAttributes,
  walker = walk,
  intercept?: WalkerCallback,
) => {
  deferHandlingDirectives(() => {
    walker(el, (el, skip) => {
      intercept?.(el, skip);

      initInterceptors.forEach((i) => i(el, skip));

      directives(el, el.attributes).forEach((handle) => handle());

      el._x_ignore && skip();
    });
  });
};

export const destroyTree = (root: ElementWithXAttributes) => {
  walk(root, (el) => {
    cleanupElement(el);
    cleanupAttributes(el);
  });
};
