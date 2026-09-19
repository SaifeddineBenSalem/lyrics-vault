export type SectionType =
  | 'intro'
  | 'verse'
  | 'pre-hook'
  | 'hook'
  | 'bridge'
  | 'breakdown'
  | 'outro'
  | 'interlude'
  | 'custom';

export interface LyricSection {
  readonly id: string;
  type: SectionType;
  name: string;
  content: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  intro: 'Intro',
  verse: 'Verse',
  'pre-hook': 'Pre-Hook',
  hook: 'Hook',
  bridge: 'Bridge',
  breakdown: 'Breakdown',
  outro: 'Outro',
  interlude: 'Interlude',
  custom: 'Custom'
};

export const DEFAULT_SONG_STRUCTURE: ReadonlyArray<{ type: SectionType; name: string }> = [
  { type: 'intro', name: 'Intro' },
  { type: 'verse', name: 'Verse 1' },
  { type: 'hook', name: 'Hook' },
  { type: 'verse', name: 'Verse 2' },
  { type: 'hook', name: 'Hook' },
  { type: 'outro', name: 'Outro' }
];
