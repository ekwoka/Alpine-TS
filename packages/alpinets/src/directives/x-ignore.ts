import { directive } from '../directives';
import { DirectiveCallback } from '../types';

// biome-ignore lint/suspicious/noEmptyBlockStatements: Intentional No-op
const handler: DirectiveCallback = () => {};

handler.inline = (el, { modifiers }, { cleanup }) => {
  modifiers.includes('self')
    ? (el._x_ignoreSelf = true)
    : (el._x_ignore = true);

  cleanup(() => {
    modifiers.includes('self') ? delete el._x_ignoreSelf : delete el._x_ignore;
  });
};

directive('ignore', handler);
