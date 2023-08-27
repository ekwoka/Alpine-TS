import { closestIdRoot, findAndIncrementId } from '../ids';
import { magic } from '../magics';

magic('id', (el) => (name: string, key = null) => {
  const root = closestIdRoot(el, name);

  const id = root ? root._x_ids[name] : findAndIncrementId(name);

  return key ? `${name}-${id}-${key}` : `${name}-${id}`;
});

declare module '../magics' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Magics<T> {
    /**
     * Generate an element's ID and ensure that it won't conflict with other IDs of the same name on the same page.
     *
     * @param name the name of the id
     * @param key suffix on the end of the generated ID, usually helpful for the purpose of identifying id in a loop
     */
    $id: (name: string, key?: number | string) => string;
  }
}
