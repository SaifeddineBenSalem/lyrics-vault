export interface Tag {
  readonly id: string;
  name: string;
  color: string;
  createdAt: number;
}

export const DEFAULT_TAGS: ReadonlyArray<{ name: string; color: string }> = [
  { name: 'dark', color: '#8b5cf6' },
  { name: 'aggressive', color: '#ef4444' },
  { name: 'melodic', color: '#22d3ee' },
  { name: 'sad', color: '#7c3aed' },
  { name: 'trap', color: '#f59e0b' },
  { name: 'drill', color: '#f97316' },
  { name: 'love', color: '#ec4899' },
  { name: 'freestyle', color: '#2dd4bf' },
  { name: 'unfinished', color: '#a78bfa' }
];

export const createTag = (name: string, color: string): Tag => ({
  id: crypto.randomUUID(),
  name: name.trim().toLowerCase(),
  color,
  createdAt: Date.now()
});
