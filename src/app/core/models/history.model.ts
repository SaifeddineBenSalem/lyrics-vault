export type HistoryAction =
  | 'song_created'
  | 'song_edited'
  | 'version_created'
  | 'version_restored'
  | 'section_added'
  | 'section_deleted'
  | 'audio_added'
  | 'audio_deleted'
  | 'song_archived'
  | 'song_restored';

export interface HistoryEntry {
  readonly id: string;
  songId: string;
  action: HistoryAction;
  description: string;
  createdAt: number;
}

export const createHistoryEntry = (
  songId: string,
  action: HistoryAction,
  description: string
): HistoryEntry => ({
  id: crypto.randomUUID(),
  songId,
  action,
  description,
  createdAt: Date.now()
});
