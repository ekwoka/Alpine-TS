import { closestIdRoot, findAndIncrementId } from '../ids';
import { magic } from '../magics';

magic('id', (el) => (name, key = null) => {
  const root = closestIdRoot(el, name);

  const id = root ? root._x_ids[name] : findAndIncrementId(name);

  return key ? `${name}-${id}-${key}` : `${name}-${id}`;
});
