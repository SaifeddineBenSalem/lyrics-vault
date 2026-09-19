import { Injectable } from '@angular/core';

export interface RhymeAnalysis {
  lines: string[];
  finalWords: string[];
  normalizedWords: string[];
  rhymeGroups: string[][];
  rhymeScheme: string;
  uniqueEndings: string[];
  internalRhymes: string[];
  rhymeDensity: number;
}

@Injectable({ providedIn: 'root' })
export class RhymeService {
  analyze(text: string): RhymeAnalysis {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const finalWords = lines.map((line) => this.getFinalWord(line)).filter(Boolean);
    const normalizedWords = finalWords.map((word) => this.normalizeWord(word));

    const rhymeGroups: string[][] = [];
    const seen = new Set<string>();

    for (let i = 0; i < normalizedWords.length; i += 1) {
      const word = normalizedWords[i];
      if (!word || seen.has(word)) {
        continue;
      }

      const group = normalizedWords.filter((item) => item && this.areRhyming(item, word));
      if (group.length > 0) {
        rhymeGroups.push([...new Set(group)]);
        group.forEach((item) => seen.add(item));
      }
    }

    const uniqueEndings = [...new Set(normalizedWords.filter(Boolean))];
    const rhymeScheme = this.generateScheme(normalizedWords);
    const internalRhymes = this.detectInternalRhymes(lines);
    const rhymeDensity = lines.length > 0 ? Number(((normalizedWords.filter(Boolean).length / lines.length) * 100).toFixed(1)) : 0;

    return {
      lines,
      finalWords,
      normalizedWords,
      rhymeGroups,
      rhymeScheme,
      uniqueEndings,
      internalRhymes,
      rhymeDensity
    };
  }

  private getFinalWord(line: string): string {
    const match = line.trim().match(/([A-Za-z]+)(?:[^A-Za-z]+)?$/);
    return match ? match[1] : '';
  }

  private normalizeWord(word: string): string {
    return word.toLowerCase().replace(/[^a-z]/g, '').replace(/(ing|ed|es|s)$/, '');
  }

  private areRhyming(left: string, right: string): boolean {
    if (!left || !right || left === right) {
      return left === right;
    }

    const a = this.normalizeWord(left);
    const b = this.normalizeWord(right);
    if (!a || !b) {
      return false;
    }

    const maxLength = Math.min(a.length, b.length);
    const suffixA = a.slice(-Math.min(3, maxLength));
    const suffixB = b.slice(-Math.min(3, maxLength));
    return suffixA === suffixB || a.slice(-2) === b.slice(-2);
  }

  private generateScheme(words: string[]): string {
    if (!words.length) {
      return '';
    }

    const letters: string[] = [];
    const groupMap = new Map<string, string>();
    let nextLetter = 65;

    for (const word of words) {
      const match = [...groupMap.entries()].find(([, value]) => this.areRhyming(value, word));
      if (match) {
        letters.push(match[0]);
        continue;
      }

      const letter = String.fromCharCode(nextLetter++);
      groupMap.set(letter, word);
      letters.push(letter);
    }

    return letters.join(' ');
  }

  private detectInternalRhymes(lines: string[]): string[] {
    const matches: string[] = [];

    for (const line of lines) {
      const words = line.toLowerCase().match(/[a-z']+/g) ?? [];
      for (let i = 0; i < words.length; i += 1) {
        for (let j = i + 1; j < words.length; j += 1) {
          if (this.areRhyming(words[i], words[j])) {
            matches.push(`${words[i]} / ${words[j]}`);
          }
        }
      }
    }

    return [...new Set(matches)].slice(0, 10);
  }
}
