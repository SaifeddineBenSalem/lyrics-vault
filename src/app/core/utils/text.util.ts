export const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const countWords = (value: string): number => {
  const text = value.trim();
  if (!text) {
    return 0;
  }

  return text.split(/\s+/).filter(Boolean).length;
};

export const countCharacters = (value: string): number => value.length;

export const countLines = (value: string): number => value.length === 0 ? 0 : value.split(/\r?\n/).length;

export const getAverageWordsPerLine = (value: string): number => {
  const lines = value.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return 0;
  }

  const totalWords = lines.reduce((sum, line) => sum + countWords(line), 0);
  return Number((totalWords / lines.length).toFixed(2));
};

export const sanitizeImportText = (value: string): string => value.trim();
