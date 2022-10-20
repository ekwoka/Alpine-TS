import { directive } from '../directives';

directive('modelable', (el, { expression }, { effect, evaluateLater }) => {
  const func = evaluateLater<unknown>(expression);
  const innerGet = () => {
    let result: unknown;
    func((i) => (result = i));
    return result;
  };
  const evaluateInnerSet = evaluateLater(`${expression} = __placeholder`);
  const innerSet = (val: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    evaluateInnerSet(() => {}, { scope: { __placeholder: val } });

  const initialValue = innerGet();

  innerSet(initialValue);

  queueMicrotask(() => {
    if (!el._x_model) return;

    // Remove native event listeners as these are now bound with x-modelable.
    // The reason for this is that it's often useful to wrap <input> elements
    // in x-modelable/model, but the input events from the native input
    // override any functionality added by x-modelable causing confusion.
    el._x_removeModelListeners['default']();

    const outerGet = el._x_model.get;
    const outerSet = el._x_model.set;

    effect(() => innerSet(outerGet()));
    effect(() => outerSet(innerGet()));
  });
});
