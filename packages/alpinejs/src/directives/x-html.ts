import { directive } from '../directives';
import { initTree } from '../lifecycle';
import { mutateDom } from '../mutation';

directive('html', (el, { expression }, { effect, evaluateLater }) => {
  const evaluate = evaluateLater<string>(expression);

  effect(() =>
    evaluate((value) =>
      mutateDom(() => {
        el.innerHTML = value;

        el._x_ignoreSelf = true;
        initTree(el);
        delete el._x_ignoreSelf;
      })
    )
  );
});
