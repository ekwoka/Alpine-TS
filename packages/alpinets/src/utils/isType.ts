export const isNumeric = (subject: unknown): subject is number =>
  !Array.isArray(subject) && !isNaN(Number(subject));

export const isObject = (
  subject: unknown,
): subject is Record<string, unknown> =>
  typeof subject === 'object' && !Array.isArray(subject) && subject !== null;
