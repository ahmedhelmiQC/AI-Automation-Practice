export const parseMoney = (text: string): number => {
  const match = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    throw new Error(`No amount found in "${text}"`);
  }
  return Number(match[0]);
};
