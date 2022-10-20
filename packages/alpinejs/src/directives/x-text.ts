import { directive } from '../directives';
import { mutateDom } from '../mutation';

directive('text', (el, { expression }, { effect, evaluateLater }) => {
  const evaluate = evaluateLater<string>(expression);

  effect(() => {
    evaluate((value) => {
      mutateDom(() => {
        el.textContent = value;
      });
    });
  });
});
