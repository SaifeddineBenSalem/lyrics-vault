export const ALBUM_STATUSES = ['Draft', 'Planned', 'In Progress', 'Ready', 'Released'] as const;
export type AlbumStatus = typeof ALBUM_STATUSES[number];

export interface Album {
  readonly id: string;
  name: string;
  artist: string;
  description: string;
  genre: string;
  releaseDate: string;
  status: AlbumStatus;
  coverImage: string | null;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}

export const normalizeAlbum = (album: Partial<Album> = {}): Album => ({
  id: album.id ?? crypto.randomUUID(),
  name: album.name?.trim() || 'Untitled Album',
  artist: album.artist?.trim() || 'Artist',
  description: album.description ?? '',
  genre: album.genre?.trim() || 'Other',
  releaseDate: album.releaseDate ?? '',
  status: ALBUM_STATUSES.includes(album.status as AlbumStatus) ? album.status as AlbumStatus : 'Draft',
  coverImage: album.coverImage ?? null,
  songIds: Array.isArray(album.songIds) ? [...new Set(album.songIds.filter(Boolean))] : [],
  createdAt: album.createdAt ?? Date.now(),
  updatedAt: album.updatedAt ?? Date.now()
});

export const createDefaultAlbum = (overrides: Partial<Album> = {}): Album => normalizeAlbum(overrides);
