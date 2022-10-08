import { magic } from '../magics';
import { mergeProxies } from '../scope';

magic('refs', (el) => {
  if (el._x_refs_proxy) return el._x_refs_proxy;

  el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));

  return el._x_refs_proxy;
});

function getArrayOfRefObject(el) {
  let refObjects = [];

  let currentEl = el;

  while (currentEl) {
    if (currentEl._x_refs) refObjects.push(currentEl._x_refs);

    currentEl = currentEl.parentNode;
  }

  return refObjects;
}
