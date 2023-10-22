import { ElementWithXAttributes } from '../types';

export const warn = (message: string, el?: ElementWithXAttributes) => {
  console.warn(`Alpine Warning: ${message}`, el);
};
