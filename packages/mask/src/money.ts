export const formatMoney = (
  input: string,
  delimiter = '.',
  thousands?: string,
  precision = 2,
) => {
  if (input === '-') return '-';
  if (/^\D+$/.test(input)) return '9';

  thousands ??= delimiter === ',' ? '.' : ',';

  const minus = input.startsWith('-') ? '-' : '';
  const strippedInput = input.split(delimiter)[0].replaceAll(/[-,.]/g, '');

  const template = `${minus}${addThousands(strippedInput, thousands)}${
    precision > 0 && input.includes(delimiter)
      ? `${delimiter}${'9'.repeat(precision)}`
      : ''
  }`;

  return template;
};
export const addThousands = (input: string, thousands: string = ',') =>
  Array(((input.length - 1) / 3) | 0)
    .fill(`${thousands}999`)
    .join('')
    .padStart((input.length + (input.length - 1) / 3) | 0, '9');
