import { Alpine as AlpineType } from '../src/alpine';
import Alpine from '../src/index';

(window as typeof window & { Alpine: AlpineType }).Alpine = Alpine;

queueMicrotask(() => {
  Alpine.start();
});
