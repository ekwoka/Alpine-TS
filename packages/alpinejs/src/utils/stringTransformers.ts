export const kebabCase = (subject: string) =>
  subject
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]/, '-')
    .toLowerCase();

export const camelCase = (subject: string) =>
  subject.toLowerCase().replace(/-(\w)/g, (_, char) => char.toUpperCase());

export const dotSyntax = (subject: string) => subject.replace(/-/g, '.');
