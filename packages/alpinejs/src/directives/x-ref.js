import { directive } from '../directives';
import { closestRoot } from '../lifecycle';

// eslint-disable-next-line @typescript-eslint/no-empty-function
function handler() {}

handler.inline = (el, { expression }, { cleanup }) => {
  let root = closestRoot(el);

  if (!root._x_refs) root._x_refs = {};

  root._x_refs[expression] = el;

  cleanup(() => delete root._x_refs[expression]);
};

directive('ref', handler);
