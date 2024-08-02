const queue: (() => void)[] = [];
let flushPending = false;
let flushing = false;

export const scheduler = (callback: () => void) => queueJob(callback);

const queueJob = (job: () => void) => {
  if (!queue.includes(job)) queue.push(job);

  queueFlush();
};
let lastFlushed = -1;
export const dequeueJob = (job: () => void) => {
  const index = queue.indexOf(job, lastFlushed);

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

  for (let i = 0; i < queue.length; i++) {
    const cb = queue[i];
    lastFlushed = i;
    cb();
  }
  lastFlushed = -1;
  queue.length = 0;
  flushing = false;
};
