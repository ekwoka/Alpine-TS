import { directive } from '../directives';
import { entangle } from '../entangle';

directive('modelable', (el, { expression }, { cleanup, evaluateLater }) => {
  type T = unknown;
  const func = evaluateLater<T>(expression);
  const innerGet = () => {
    let result: T;
    func((i) => (result = i));
    return result;
  };
  const evaluateInnerSet = evaluateLater(`${expression} = __placeholder`);
  const innerSet = (val: T) =>
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Intentional No-op
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

    const releaseEntanglement = entangle(
      {
        get() {
          return outerGet();
        },
        set(value) {
          outerSet(value);
        },
      },
      {
        get() {
          return innerGet();
        },
        set(value) {
          innerSet(value);
        },
      },
    );

    cleanup(releaseEntanglement);
  });
});
