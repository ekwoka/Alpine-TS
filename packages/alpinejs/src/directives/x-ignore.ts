import { directive } from '../directives';
import { DirectiveCallback } from '../types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
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
