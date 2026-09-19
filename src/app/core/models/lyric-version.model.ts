import { Song } from './song.model';
import { LyricSection } from './lyric-section.model';

export interface LyricVersion {
  readonly id: string;
  songId: string;
  name: string;
  description: string;
  sections: LyricSection[];
  metadata: {
    title: string;
    artist: string;
    genre: string;
    subGenre: string;
    bpm: number;
    key: string;
    timeSignature: string;
    language: string;
    mood: string[];
    status: Song['status'];
  };
  createdAt: number;
  parentVersionId?: string | null;
}

export const normalizeLyricVersion = (version: Partial<LyricVersion>): LyricVersion => ({
  id: version.id ?? crypto.randomUUID(),
  songId: version.songId ?? '',
  name: version.name?.trim() || 'Untitled version',
  description: version.description ?? '',
  sections: Array.isArray(version.sections) ? version.sections.map((section) => ({ ...section })) : [],
  metadata: {
    title: version.metadata?.title ?? '',
    artist: version.metadata?.artist ?? '',
    genre: version.metadata?.genre ?? '',
    subGenre: version.metadata?.subGenre ?? '',
    bpm: version.metadata?.bpm ?? 120,
    key: version.metadata?.key ?? 'No Key',
    timeSignature: version.metadata?.timeSignature ?? '4/4',
    language: version.metadata?.language ?? 'English',
    mood: [...(version.metadata?.mood ?? [])],
    status: version.metadata?.status ?? 'writing'
  },
  createdAt: version.createdAt ?? Date.now(),
  parentVersionId: version.parentVersionId ?? null
});

export const createVersionFromSections = (
  songId: string,
  name: string,
  sections: LyricSection[],
  description: string,
  song: Pick<Song, 'title' | 'artist' | 'genre' | 'subGenre' | 'bpm' | 'key' | 'timeSignature' | 'language' | 'mood' | 'status'>,
  parentVersionId?: string | null
): LyricVersion => ({
  id: crypto.randomUUID(),
  songId,
  name,
  description,
  sections: sections.map((section) => ({ ...section })),
  metadata: {
    title: song.title,
    artist: song.artist,
    genre: song.genre,
    subGenre: song.subGenre,
    bpm: song.bpm,
    key: song.key,
    timeSignature: song.timeSignature,
    language: song.language,
    mood: [...song.mood],
    status: song.status
  },
  createdAt: Date.now(),
  parentVersionId: parentVersionId ?? null
});
