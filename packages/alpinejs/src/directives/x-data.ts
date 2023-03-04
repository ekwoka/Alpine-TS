import { skipDuringClone } from '../clone';
import { injectDataProviders } from '../data';
import { directive, prefix } from '../directives';
import { evaluate } from '../evaluator';
import { initInterceptors } from '../interceptor';
import { addRootSelector } from '../lifecycle';
import { injectMagics } from '../magics';
import { reactive } from '../reactivity';
import { addScopeToNode } from '../scope';

addRootSelector(() => `[${prefix('data')}]`);

directive(
  'data',
  skipDuringClone((el, { expression }, { cleanup }) => {
    expression = expression === '' ? '{}' : expression;

    const magicContext = {};
    injectMagics(magicContext, el);

    const dataProviderContext = {};
    injectDataProviders(dataProviderContext, magicContext);

    let data = evaluate<Record<string, unknown>>(el, expression, {
      scope: dataProviderContext,
    });

    if (([true, undefined] as unknown[]).includes(data)) data = {};

    injectMagics(data, el);

    const reactiveData = reactive(data);

    initInterceptors(reactiveData);

    const undo = addScopeToNode(el, reactiveData);

    reactiveData['init'] && evaluate(el, reactiveData['init'] as () => void);

    cleanup(() => {
      reactiveData['destroy'] &&
        evaluate(el, reactiveData['destroy'] as () => void);

      undo();
    });
  })
);
