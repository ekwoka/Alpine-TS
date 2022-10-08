import { Bindings } from './binds';

export type ElementWithXAttributes = Element & {
  _x_virtualDirectives?: Bindings;
  _x_ids?: Record<string, number>;
};
