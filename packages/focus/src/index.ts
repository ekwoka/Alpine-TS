import { PluginCallback } from '@alpinets/alpinets';
import { Options, createFocusTrap } from 'focus-trap';
import { FocusableElement, focusable, isFocusable } from 'tabbable';

// biome-ignore lint/suspicious/noEmptyBlockStatements: Intentional No-op
const noop = () => {};
let lastFocused: FocusableElement;
let currentFocused: FocusableElement;
export class Focus {
  private preventScroll = false;
  private wrapAround = false;
  private withinElement: FocusableElement;

  constructor(withinElement: FocusableElement) {
    this.withinElement = withinElement;
  }
  within(el: FocusableElement) {
    this.withinElement = el;
    return this;
  }
  withoutScrolling() {
    this.preventScroll = true;
    return this;
  }
  noscroll() {
    this.preventScroll = true;
    return this;
  }
  withWrapAround() {
    return this.wrap();
  }
  wrap() {
    this.wrapAround = true;
    return this;
  }
  focusable(el: Element) {
    return isFocusable(el);
  }
  previouslyFocused() {
    return lastFocused;
  }
  lastFocused() {
    return lastFocused;
  }
  focused() {
    return currentFocused;
  }
  focusables() {
    return this.all();
  }
  all() {
    return focusable(this.withinElement, { displayCheck: 'none' });
  }
  isFirst(el: Element) {
    return this.getFirst()?.isSameNode(el);
  }
  isLast(el: Element) {
    return this.getLast()?.isSameNode(el);
  }
  getFirst(): FocusableElement | undefined {
    return this.all()[0];
  }
  getLast(): FocusableElement | undefined {
    return this.all().slice(-1)[0];
  }
  getOffset(offset: 1 | -1) {
    const list = this.all() as FocusableElement[];
    const currentIndex = list.indexOf(
      document.activeElement as FocusableElement,
    );

    // Can't find currently focusable element in list.
    if (currentIndex === -1) return;

    let targetIndex = currentIndex + offset;
    if (this.wrapAround) {
      targetIndex += list.length;
      targetIndex %= list.length;
    }

    return list[targetIndex];
  }
  getNext() {
    return this.getOffset(1);
  }
  getPrevious() {
    return this.getOffset(-1);
  }
  first() {
    this.focus(this.getFirst());
  }
  last() {
    this.focus(this.getLast());
  }
  next() {
    this.focus(this.getNext());
  }
  previous() {
    this.focus(this.getPrevious());
  }
  prev() {
    return this.previous();
  }
  focus(el: FocusableElement) {
    if (!el) return;

    setTimeout(() => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');

      el.focus({ preventScroll: this.preventScroll });
    });
  }
}
export const focusPlugin: PluginCallback = (Alpine) => {
  window.addEventListener('focusin', () => {
    lastFocused = currentFocused;
    currentFocused = document.activeElement as FocusableElement;
  });

  Alpine.magic('focus', (el) => new Focus(el));

  Alpine.directive(
    'trap',
    Alpine.skipDuringClone(
      (el, { expression, modifiers }, { effect, evaluateLater, cleanup }) => {
        const evaluator = evaluateLater(expression);

        let oldValue = false;

        const options: Options = {
          escapeDeactivates: false,
          allowOutsideClick: true,
          fallbackFocus: () => el,
        };

        const autofocusEl = el.querySelector<HTMLElement>('[autofocus]');

        if (autofocusEl) options.initialFocus = autofocusEl;

        const trap = createFocusTrap(el, options);

        let undoInert = noop;
        let undoDisableScrolling = noop;

        const releaseFocus = () => {
          undoInert();
          undoInert = noop;

          undoDisableScrolling();
          undoDisableScrolling = noop;

          trap.deactivate({
            returnFocus: !modifiers.includes('noreturn'),
          });
        };

        effect(() =>
          evaluator((value) => {
            if (oldValue === value) return;

            // Start trapping.
            if (value && !oldValue) {
              setTimeout(() => {
                if (modifiers.includes('inert')) undoInert = setInert(el);
                if (modifiers.includes('noscroll'))
                  undoDisableScrolling = disableScrolling();

                trap.activate();
              });
            }

            // Stop trapping.
            if (!value && oldValue) {
              releaseFocus();
            }

            oldValue = !!value;
          }),
        );

        cleanup(releaseFocus);
      },
      // When cloning, we only want to add aria-hidden attributes to the
      // DOM and not try to actually trap, as trapping can mess with the
      // live DOM and isn't just isolated to the cloned DOM.
      (el, { expression, modifiers }, { evaluate }) => {
        if (modifiers.includes('inert') && evaluate(expression)) setInert(el);
      },
    ),
  );
};

export default focusPlugin;

const setInert = (el: HTMLElement) => {
  const undos = [];

  crawlSiblingsUp(el, (sibling) => {
    const cache = sibling.hasAttribute('aria-hidden');

    sibling.setAttribute('aria-hidden', 'true');

    undos.push(() => cache || sibling.removeAttribute('aria-hidden'));
  });

  return () => {
    while (undos.length) undos.pop()();
  };
};

const crawlSiblingsUp = (el: Element, callback: (el: Element) => void) => {
  if (el.isSameNode(document.body) || !el.parentNode) return;

  Array.from(el.parentNode.children).forEach((sibling) => {
    if (sibling.isSameNode(el)) {
      crawlSiblingsUp(el.parentNode as Element, callback);
    } else {
      callback(sibling);
    }
  });
};

const disableScrolling = () => {
  const overflow = document.documentElement.style.overflow;
  const paddingRight = document.documentElement.style.paddingRight;

  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.paddingRight = `${scrollbarWidth}px`;

  return () => {
    document.documentElement.style.overflow = overflow;
    document.documentElement.style.paddingRight = paddingRight;
  };
};

declare module '@alpinets/alpinets' {
  // biome-ignore lint/correctness/noUnusedVariables: Needed for Interface Extension
  export interface Magics<T> {
    $focus: Focus;
  }
}
