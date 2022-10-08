import { Bindings } from './binds';

export type ElementWithXAttributes = Element & {
  _x_virtualDirectives: Bindings;
};
