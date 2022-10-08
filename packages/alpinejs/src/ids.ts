import { findClosest } from './lifecycle';
import { ElementWithXAttributes } from './types';

const globalIdMemo: Record<string, number> = {};

export const findAndIncrementId = (name: string) => {
  if (!globalIdMemo[name]) globalIdMemo[name] = 0;

  return ++globalIdMemo[name];
};

export const closestIdRoot = (el: ElementWithXAttributes, name: string) =>
  findClosest(el, (element: ElementWithXAttributes) => {
    if (element._x_ids && element._x_ids[name]) return true;
  });

export const setIdRoot = (el: ElementWithXAttributes, name: string) => {
  if (!el._x_ids) el._x_ids = {};
  if (!el._x_ids[name]) el._x_ids[name] = findAndIncrementId(name);
};
