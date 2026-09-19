import { Injectable } from '@angular/core';
import { DATABASE_NAME, DATABASE_VERSION, DbStoreName, STORE_CONFIGS } from './database.types';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  openDatabase(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = (event) => {
          const db = request.result;
          const oldVersion = (event as IDBVersionChangeEvent).oldVersion;

          if (oldVersion < 3 && db.objectStoreNames.contains('collections')) {
            db.deleteObjectStore('collections');
          }

          for (const storeConfig of STORE_CONFIGS) {
            if (!db.objectStoreNames.contains(storeConfig.name)) {
              const store = db.createObjectStore(storeConfig.name, storeConfig.options ?? { keyPath: 'id' });

              for (const index of storeConfig.indexes ?? []) {
                if (!store.indexNames.contains(index.name)) {
                  store.createIndex(index.name, index.keyPath, index.options ?? {});
                }
              }
            }
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB database'));
      });
    }

    return this.dbPromise;
  }

  async add<T>(storeName: DbStoreName, value: T): Promise<T> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve(value);
      request.onerror = () => reject(request.error ?? new Error(`Failed to add record to ${storeName}`));
    });
  }

  async update<T>(storeName: DbStoreName, value: T): Promise<T> {
    return this.add(storeName, value);
  }

  async delete(storeName: DbStoreName, key: string): Promise<void> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error(`Failed to delete ${key} from ${storeName}`));
    });
  }

  async get<T>(storeName: DbStoreName, key: string): Promise<T | undefined> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(key);

      request.onsuccess = () => resolve((request.result as T | undefined) ?? undefined);
      request.onerror = () => reject(request.error ?? new Error(`Failed to get ${key} from ${storeName}`));
    });
  }

  async getAll<T>(storeName: DbStoreName): Promise<T[]> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();

      request.onsuccess = () => resolve((request.result as T[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error(`Failed to get all records from ${storeName}`));
    });
  }

  async getAllByIndex<T>(storeName: DbStoreName, indexName: string, value: IDBValidKey): Promise<T[]> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const store = db.transaction(storeName, 'readonly').objectStore(storeName);
      const request = store.index(indexName).getAll(value);

      request.onsuccess = () => resolve((request.result as T[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error(`Failed to query ${storeName}.${indexName}`));
    });
  }

  async clearStore(storeName: DbStoreName): Promise<void> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error(`Failed to clear ${storeName}`));
    });
  }

  async deleteSongCascade(songId: string): Promise<void> {
    const db = await this.openDatabase();
    const storeNames: DbStoreName[] = ['songs', 'versions', 'history', 'audio', 'albums'];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');
      const songStore = tx.objectStore('songs');
      const versions = tx.objectStore('versions').getAll();
      const history = tx.objectStore('history').getAll();
      const audio = tx.objectStore('audio').getAll();
      const albums = tx.objectStore('albums').getAll();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error(`Failed to permanently delete song ${songId}`));
      tx.onabort = () => reject(tx.error ?? new Error(`Failed to permanently delete song ${songId}`));

      const removeMatchingRecords = (request: IDBRequest<unknown[]>, storeName: 'versions' | 'history' | 'audio'): void => {
        request.onsuccess = () => {
          for (const record of request.result as Array<{ id: string; songId?: string }>) {
            if (record.songId === songId) {
              tx.objectStore(storeName).delete(record.id);
            }
          }
        };
      };

      removeMatchingRecords(versions, 'versions');
      removeMatchingRecords(history, 'history');
      removeMatchingRecords(audio, 'audio');
      albums.onsuccess = () => {
        for (const album of albums.result as Array<{ id: string; songIds?: string[]; updatedAt?: number }>) {
          if (album.songIds?.includes(songId)) {
            tx.objectStore('albums').put({ ...album, songIds: album.songIds.filter((id) => id !== songId), updatedAt: Date.now() });
          }
        }
      };
      songStore.delete(songId);
    });
  }
}
