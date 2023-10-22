import { directive } from '../directives';
import { setIdRoot } from '../ids';

directive('id', (el, { expression }, { evaluate }) => {
  const names = evaluate<string[]>(expression);

  names.forEach((name) => setIdRoot(el, name));
});
