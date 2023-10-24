export const formatInput = (template: string, input: string) => {
  // Let empty inputs be empty inputs.
  if (input === '') return '';

  const strippedDownInput = stripDown(template, input);
  const rebuiltInput = buildUp(template, strippedDownInput);

  return rebuiltInput;
};

const regexes = {
  '9': /[0-9]/,
  a: /[a-zA-Z]/,
  '*': /[a-zA-Z0-9]/,
};
export const stripDown = (template: string, input: string) => {
  let wildcardTemplate = '';

  // Strip away non wildcard template characters.
  for (const char of template)
    if (char in regexes) wildcardTemplate += char;
    else input = input.replace(char, '');

  let output = '';
  for (const tempChar of wildcardTemplate) {
    let found = false;

    for (const char of input) {
      if (!regexes[tempChar].test(char)) continue;
      output += char;
      input = input.replace(char, '');
      found = true;
      break;
    }

    if (!found) break;
  }

  return output;
};

export const buildUp = (template: string, input: string) => {
  const clean = Array.from(input);
  let output = '';

  for (const char of template) {
    if (!(char in regexes)) {
      output += char;
      continue;
    }

    if (clean.length === 0) break;

    output += clean.shift();
  }

  return output;
};
