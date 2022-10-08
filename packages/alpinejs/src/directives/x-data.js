import { skipDuringClone } from '../clone';
import { injectDataProviders } from '../datas';
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

    let magicContext = {};
    injectMagics(magicContext, el);

    let dataProviderContext = {};
    injectDataProviders(dataProviderContext, magicContext);

    let data = evaluate(el, expression, { scope: dataProviderContext });

    if (data === undefined) data = {};

    injectMagics(data, el);

    let reactiveData = reactive(data);

    initInterceptors(reactiveData);

    let undo = addScopeToNode(el, reactiveData);

    reactiveData['init'] && evaluate(el, reactiveData['init']);

    cleanup(() => {
      reactiveData['destroy'] && evaluate(el, reactiveData['destroy']);

      undo();
    });
  })
);
