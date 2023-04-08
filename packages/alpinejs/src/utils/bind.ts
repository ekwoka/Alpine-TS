import { fromModel } from '../directives/x-model';
import { reactive } from '../reactivity';
import { ElementWithXAttributes } from '../types';
import { setClasses } from './classes';
import { camelCase } from './stringTransformers';
import { setStyles } from './styles';

export const bind = (
  el: ElementWithXAttributes,
  name: string,
  value: unknown,
  modifiers: string[] = []
) => {
  // Register bound data as pure observable data for other APIs to use.
  if (!el._x_bindings) el._x_bindings = reactive({});

  el._x_bindings[name] = value;

  name = modifiers.includes('camel') ? camelCase(name) : name;

  switch (name) {
    case 'value':
      bindInputValue(
        el as ElementWithXAttributes & HTMLInputElement,
        value as string
      );
      break;

    case 'style':
      bindStyles(el, value as string | Record<string, string>);
      break;

    case 'class':
      bindClasses(el, value as string | Record<string, boolean>);
      break;

    default:
      bindAttribute(el, name, value as string | boolean);
      break;
  }
};

const bindInputValue = (
  el: ElementWithXAttributes & HTMLInputElement,
  value: string
) => {
  if (el.type === 'radio') {
    // Set radio value from x-bind:value, if no "value" attribute exists.
    // If there are any initial state values, radio will have a correct
    // "checked" value since x-bind:value is processed before x-model.
    if (
      (el.attributes as unknown as Record<string, unknown>).value === undefined
    )
      el.value = value;

    if (fromModel) el.checked = checkedAttrLooseCompare(el.value, value);
    return;
  }

  if (el.type === 'checkbox') {
    // If we are explicitly binding a string to the :value, set the string,
    // If the value is a boolean/array/number/null/undefined, leave it alone, it will be set to "on"
    // automatically.
    if (Number.isInteger(value)) return (el.value = value);

    if (Array.isArray(value))
      return (el.checked = value.some((val) =>
        checkedAttrLooseCompare(val, el.value)
      ));
    if (typeof value !== 'boolean' && ![null, undefined].includes(value))
      return (el.value = String(value));

    return (el.checked = !!value);
  }

  if (el.tagName === 'SELECT') return updateSelect(el, value);

  if (el.value === value) return;
  el.value = value;
};

const bindClasses = (
  el: ElementWithXAttributes,
  value:
    | string
    | boolean
    | Record<string, boolean>
    | (() => string | boolean | Record<string, boolean>)
) => {
  if (el._x_undoAddedClasses) el._x_undoAddedClasses();

  el._x_undoAddedClasses = setClasses(el, value);
};

const bindStyles = (
  el: ElementWithXAttributes,
  value: string | Record<string, string>
) => {
  if (el._x_undoAddedStyles) el._x_undoAddedStyles();

  el._x_undoAddedStyles = setStyles(el, value);
};

const bindAttribute = (
  el: ElementWithXAttributes,
  name: string,
  value: string | boolean
) => {
  if (
    [null, undefined, false].includes(value as boolean) &&
    attributeShouldntBePreservedIfFalsy(name)
  )
    return el.removeAttribute(name);

  if (isBooleanAttr(name)) value = name;
  setIfChanged(el, name, value as string);
};

const setIfChanged = (
  el: ElementWithXAttributes,
  attrName: string,
  value: string
) => el.getAttribute(attrName) != value && el.setAttribute(attrName, value);

const updateSelect = (
  el: ElementWithXAttributes,
  value: string | boolean | string[]
) => {
  const arrayWrappedValue = [].concat(value).map(String);

  Array.from((el as unknown as HTMLSelectElement).options).forEach(
    (option) => (option.selected = arrayWrappedValue.includes(option.value))
  );
};

export const checkedAttrLooseCompare = (valueA: unknown, valueB: unknown) =>
  valueA == valueB;

// As per HTML spec table https://html.spec.whatwg.org/multipage/indices.html#attributes-3:boolean-attribute
// Array roughly ordered by estimated usage
const booleanAttributes = [
  'disabled',
  'checked',
  'required',
  'readonly',
  'hidden',
  'open',
  'selected',
  'autofocus',
  'itemscope',
  'multiple',
  'novalidate',
  'allowfullscreen',
  'allowpaymentrequest',
  'formnovalidate',
  'autoplay',
  'controls',
  'loop',
  'muted',
  'playsinline',
  'default',
  'ismap',
  'reversed',
  'async',
  'defer',
  'nomodule',
];

const isBooleanAttr = (attrName: string) =>
  booleanAttributes.includes(attrName);

const attributeShouldntBePreservedIfFalsy = (name: string) =>
  !['aria-pressed', 'aria-checked', 'aria-expanded', 'aria-selected'].includes(
    name
  );

export const getBinding = (
  el: ElementWithXAttributes,
  name: string,
  fallback?: unknown
): unknown => {
  // First let's get it out of Alpine bound data.
  if (el._x_bindings?.[name] !== undefined) return el._x_bindings[name];

  // If not, we'll return the literal attribute.
  const attr = el.getAttribute(name);

  // Nothing bound:
  if (attr === null)
    return typeof fallback === 'function' ? fallback() : fallback;

  // The case of a custom attribute with no value. Ex: <div manual>
  if (attr === '') return true;

  if (isBooleanAttr(name)) return [name, 'true'].includes(attr);

  return attr;
};
