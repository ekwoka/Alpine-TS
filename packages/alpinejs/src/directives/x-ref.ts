import { directive } from '../directives';
import { closestRoot } from '../lifecycle';
import { DirectiveCallback } from '../types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const handler: DirectiveCallback = () => {};

handler.inline = (el, { expression }, { cleanup }) => {
  const root = closestRoot(el);

  if (!root._x_refs) root._x_refs = {};

  root._x_refs[expression] = el;

  cleanup(() => delete root._x_refs[expression]);
};

directive('ref', handler);
