import { LyricSection, SectionType } from './lyric-section.model';

export type SongStatus =
  | 'idea'
  | 'writing'
  | 'demo'
  | 'recording'
  | 'mixing'
  | 'mastering'
  | 'ready'
  | 'released'
  | 'archived';

export const SONG_STATUS_OPTIONS: readonly SongStatus[] = [
  'idea',
  'writing',
  'demo',
  'recording',
  'mixing',
  'mastering',
  'ready',
  'released'
];

export const SONG_GENRES = ['Hip-Hop', 'Trap', 'Drill', 'R&B', 'Pop', 'Rock', 'Electronic', 'Afrobeats', 'Lo-Fi', 'House', 'Rap', 'Other'] as const;
export const SONG_KEYS = ['No Key', 'C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor', 'D# Major', 'D# Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'F# Major', 'F# Minor', 'G Major', 'G Minor', 'G# Major', 'G# Minor', 'A Major', 'A Minor', 'A# Major', 'A# Minor', 'B Major', 'B Minor'] as const;
export const SONG_TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8'] as const;
export const SONG_LANGUAGES = ['English', 'French', 'Arabic', 'Spanish', 'Other'] as const;
export const SONG_MOODS = ['Dark', 'Aggressive', 'Sad', 'Melancholic', 'Happy', 'Energetic', 'Romantic', 'Chill', 'Dreamy', 'Angry', 'Motivational', 'Nostalgic', 'Melodic'] as const;

export interface Song {
  readonly id: string;
  title: string;
  artist: string;
  genre: string;
  subGenre: string;
  bpm: number;
  key: string;
  timeSignature: string;
  language: string;
  mood: string[];
  status: SongStatus;
  previousStatus?: SongStatus;
  albumId?: string | null;
  instrumentalUrl?: string;
  instrumentalAudioId?: string | null;
  sections: LyricSection[];
  tags: string[];
  favorite: boolean;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export const SONG_STATUS_LABELS: Record<SongStatus, string> = {
  idea: 'Idea',
  writing: 'Writing',
  demo: 'Demo',
  recording: 'Recording',
  mixing: 'Mixing',
  mastering: 'Mastering',
  ready: 'Ready',
  released: 'Released',
  archived: 'Archived'
};

export const normalizeSong = (song: Partial<Song> = {}): Song => {
  const normalizedMood = Array.isArray(song.mood) && song.mood.length
    ? song.mood.filter(Boolean)
    : typeof song.mood === 'string' && song.mood
      ? [song.mood]
      : ['Dreamy'];

  const validStatuses: SongStatus[] = ['idea', 'writing', 'demo', 'recording', 'mixing', 'mastering', 'ready', 'released', 'archived'];
  const validStatus = song.status && validStatuses.includes(song.status) ? song.status : 'writing';
  const previousStatus = song.previousStatus && validStatuses.includes(song.previousStatus) && song.previousStatus !== 'archived'
    ? song.previousStatus
    : validStatus === 'archived' ? 'writing' : validStatus;
  const validBpm = Number.isFinite(song.bpm) ? Math.min(300, Math.max(20, Number(song.bpm))) : 120;
  const validGenre = song.genre && SONG_GENRES.includes(song.genre as typeof SONG_GENRES[number]) ? song.genre : 'Hip-Hop';
  const validKey = song.key && SONG_KEYS.includes(song.key as typeof SONG_KEYS[number]) ? song.key : 'No Key';
  const validTimeSignature = song.timeSignature && SONG_TIME_SIGNATURES.includes(song.timeSignature as typeof SONG_TIME_SIGNATURES[number]) ? song.timeSignature : '4/4';
  const validLanguage = song.language && SONG_LANGUAGES.includes(song.language as typeof SONG_LANGUAGES[number]) ? song.language : 'English';

  return {
    id: song.id ?? crypto.randomUUID(),
    title: song.title?.trim() || 'New Song',
    artist: song.artist?.trim() || 'Artist',
    genre: validGenre,
    subGenre: song.subGenre?.trim() || 'Mainstream',
    bpm: validBpm,
    key: validKey,
    timeSignature: validTimeSignature,
    language: validLanguage,
    mood: normalizedMood,
    status: validStatus,
    previousStatus,
    albumId: song.albumId ?? null,
    instrumentalUrl: song.instrumentalUrl?.trim() || undefined,
    instrumentalAudioId: song.instrumentalAudioId ?? null,
    sections: song.sections && song.sections.length ? song.sections : [
      { id: crypto.randomUUID(), type: 'intro', name: 'Intro', content: '', order: 0, createdAt: Date.now(), updatedAt: Date.now() },
      { id: crypto.randomUUID(), type: 'verse', name: 'Verse 1', content: '', order: 1, createdAt: Date.now(), updatedAt: Date.now() },
      { id: crypto.randomUUID(), type: 'hook', name: 'Hook', content: '', order: 2, createdAt: Date.now(), updatedAt: Date.now() },
      { id: crypto.randomUUID(), type: 'verse', name: 'Verse 2', content: '', order: 3, createdAt: Date.now(), updatedAt: Date.now() },
      { id: crypto.randomUUID(), type: 'hook', name: 'Hook', content: '', order: 4, createdAt: Date.now(), updatedAt: Date.now() },
      { id: crypto.randomUUID(), type: 'outro', name: 'Outro', content: '', order: 5, createdAt: Date.now(), updatedAt: Date.now() }
    ],
    tags: Array.isArray(song.tags) ? song.tags.filter(Boolean) : [],
    favorite: Boolean(song.favorite),
    notes: song.notes ?? '',
    createdAt: song.createdAt ?? Date.now(),
    updatedAt: song.updatedAt ?? Date.now()
  };
};

export const createDefaultSong = (overrides: Partial<Song> = {}): Song => normalizeSong(overrides);

export const isSongArchived = (song: Pick<Song, 'status'>): boolean => song.status === 'archived';
export const getSectionTypeLabel = (type: SectionType): string => {
  const labelMap: Record<SectionType, string> = {
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

  return labelMap[type];
};
