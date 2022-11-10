import Alpine from '../../packages/alpinejs/src/index';

window.queueMicrotask = (cb) => Promise.resolve().then(cb);

window.Alpine = Alpine;
