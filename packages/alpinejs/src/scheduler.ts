let flushPending = false;
let flushing = false;
const queue: (() => void)[] = [];

export const scheduler = (callback: () => void) => queueJob(callback);

const queueJob = (job: () => void) => {
  if (!queue.includes(job)) queue.push(job);

  queueFlush();
};

export const dequeueJob = (job: () => void) => {
  const index = queue.indexOf(job);

  if (index !== -1) queue.splice(index, 1);
};

const queueFlush = () => {
  if (flushing || flushPending) return;

  flushPending = true;
  queueMicrotask(flushJobs);
};

export const flushJobs = () => {
  flushPending = false;
  flushing = true;

  while (queue.length) queue.shift()();

  flushing = false;
};
