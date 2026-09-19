export type DbStoreName =
  | 'songs'
  | 'versions'
  | 'albums'
  | 'tags'
  | 'audio'
  | 'history'
  | 'settings';

export interface DatabaseStoreConfig {
  name: DbStoreName;
  options?: IDBObjectStoreParameters;
  indexes?: Array<{ name: string; keyPath: string | string[]; options?: IDBIndexParameters }>;
}

export const DATABASE_NAME = 'LyricVaultDB';
export const DATABASE_VERSION = 3;
export const STORE_CONFIGS: ReadonlyArray<DatabaseStoreConfig> = [
  { name: 'songs', options: { keyPath: 'id' }, indexes: [{ name: 'updatedAt', keyPath: 'updatedAt' }, { name: 'status', keyPath: 'status' }, { name: 'favorite', keyPath: 'favorite' }, { name: 'albumId', keyPath: 'albumId' }] },
  { name: 'versions', options: { keyPath: 'id' }, indexes: [{ name: 'songId', keyPath: 'songId' }, { name: 'createdAt', keyPath: 'createdAt' }] },
  { name: 'albums', options: { keyPath: 'id' }, indexes: [{ name: 'artist', keyPath: 'artist' }, { name: 'status', keyPath: 'status' }, { name: 'updatedAt', keyPath: 'updatedAt' }] },
  { name: 'tags', options: { keyPath: 'id' }, indexes: [{ name: 'name', keyPath: 'name' }] },
  { name: 'audio', options: { keyPath: 'id' }, indexes: [{ name: 'songId', keyPath: 'songId' }, { name: 'createdAt', keyPath: 'createdAt' }] },
  { name: 'history', options: { keyPath: 'id' }, indexes: [{ name: 'songId', keyPath: 'songId' }, { name: 'createdAt', keyPath: 'createdAt' }] },
  { name: 'settings', options: { keyPath: 'id' } }
];
