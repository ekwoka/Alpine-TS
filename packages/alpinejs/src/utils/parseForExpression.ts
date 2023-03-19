export const parseForExpression = (expression: string): IteratorNames => {
  const forIteratorRE =
    /((?:(?=[[{])(?:[[{].*[\]}])|(?:(?={)(?:\[[^\]]*\})|(?:[^,}\]]*)))),?([^,}\]]*),?([^,}\]]*)$/;
  const stripParensRE = /^\s*\(|\)\s*$/g;
  const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
  const inMatch = expression.match(forAliasRE);

  if (!inMatch) return;
  const items = inMatch[2].trim();
  const iterator = inMatch[1].trim().replace(stripParensRE, '').trim();

  const [_, item, index, collection] = iterator
    .match(forIteratorRE)
    .map((match) => match?.trim() || undefined);

  return {
    items,
    item,
    index,
    collection,
  };
};

export type IteratorNames = {
  item: string;
  index?: string;
  collection?: string;
  items: string;
};
