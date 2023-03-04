import { directive } from '../directives';
import { evaluateLater } from '../evaluator';
import { mutateDom } from '../mutation';
import { ElementWithXAttributes } from '../types';
import { once } from '../utils/once';

directive(
  'show',
  (el: ElementWithXAttributes, { modifiers, expression }, { effect }) => {
    const evaluate = evaluateLater<boolean>(el, expression);

    // We're going to set this function on the element directly so that
    // other plugins like "Collapse" can overwrite them with their own logic.
    if (!el._x_doHide)
      el._x_doHide = () =>
        mutateDom(() => {
          el.style.setProperty(
            'display',
            'none',
            modifiers.includes('important') ? 'important' : undefined
          );
        });

    if (!el._x_doShow)
      el._x_doShow = () =>
        mutateDom(() => {
          if (el.style.length === 1 && el.style.display === 'none') {
            el.removeAttribute('style');
          } else {
            el.style.removeProperty('display');
          }
        });

    const hide = () => {
      el._x_doHide();
      el._x_isShown = false;
    };

    const show = () => {
      el._x_doShow();
      el._x_isShown = true;
    };

    // We are wrapping this function in a setTimeout here to prevent
    // a race condition from happening where elements that have a
    // @click.away always view themselves as shown on the page.
    const clickAwayCompatibleShow = () => setTimeout(show);

    const toggle = once<(val: boolean) => void>(
      (value) => (value ? show() : hide()),
      (value) => {
        if (typeof el._x_toggleAndCascadeWithTransitions === 'function') {
          el._x_toggleAndCascadeWithTransitions(el, value, show, hide);
        } else {
          value ? clickAwayCompatibleShow() : hide();
        }
      }
    );

    let oldValue: boolean;
    let firstTime = true;

    effect(() =>
      evaluate((value) => {
        // Let's make sure we only call this effect if the value changed.
        // This prevents "blip" transitions. (1 tick out, then in)
        if (!firstTime && value === oldValue) return;

        if (modifiers.includes('immediate'))
          value ? clickAwayCompatibleShow() : hide();

        toggle(value);

        oldValue = value;
        firstTime = false;
      })
    );
  }
);
