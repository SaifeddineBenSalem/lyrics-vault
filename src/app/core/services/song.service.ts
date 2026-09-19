import { Injectable, signal } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Song, createDefaultSong, normalizeSong } from '../models/song.model';

@Injectable({ providedIn: 'root' })
export class SongService {
  readonly songs = signal<Song[]>([]);
  readonly selectedSong = signal<Song | null>(null);

  constructor(private readonly database: DatabaseService) {}

  async loadAll(): Promise<Song[]> {
    const songs = await this.database.getAll<Song>('songs');
    const normalized = songs.map((song) => normalizeSong(song));
    const sorted = [...normalized].sort((a, b) => b.updatedAt - a.updatedAt);
    this.songs.set(sorted);
    return sorted;
  }

  async save(song: Song): Promise<Song> {
    const updated = normalizeSong({ ...song, updatedAt: Date.now() });
    await this.database.add('songs', updated);
    const current = this.songs();
    const next = current.some((item) => item.id === updated.id)
      ? current.map((item) => item.id === updated.id ? updated : item)
      : [updated, ...current];
    this.songs.set(next.sort((a, b) => b.updatedAt - a.updatedAt));
    this.selectedSong.set(updated);
    return updated;
  }

  async updateSong(song: Song): Promise<Song> {
    return this.save(song);
  }

  async create(song?: Partial<Song>): Promise<Song> {
    const next = createDefaultSong(song);
    return this.save(next);
  }

  async createSong(song?: Partial<Song>): Promise<Song> {
    return this.create(song);
  }

  async archive(id: string): Promise<Song> {
    const song = await this.getById(id);
    if (!song) {
      throw new Error('Song not found');
    }
    return this.save({
      ...song,
      status: 'archived',
      previousStatus: song.status === 'archived' ? song.previousStatus : song.status
    });
  }

  async restore(id: string): Promise<Song> {
    const song = await this.getById(id);
    if (!song) {
      throw new Error('Song not found');
    }
    const previousStatus = song.previousStatus && song.previousStatus !== 'archived' ? song.previousStatus : 'writing';
    return this.save({ ...song, status: previousStatus, previousStatus });
  }

  async deletePermanently(id: string): Promise<void> {
    await this.database.deleteSongCascade(id);
    this.songs.set(this.songs().filter((song) => song.id !== id));
    if (this.selectedSong()?.id === id) {
      this.selectedSong.set(null);
    }
  }

  async getById(id: string): Promise<Song | undefined> {
    const song = await this.database.get<Song>('songs', id);
    const normalized = song ? normalizeSong(song) : undefined;
    if (normalized) {
      this.selectedSong.set(normalized);
    }
    return normalized;
  }

  async getSong(id: string): Promise<Song | undefined> {
    return this.getById(id);
  }

  async getSongs(): Promise<Song[]> {
    return this.loadAll();
  }

  async delete(id: string): Promise<void> {
    await this.database.delete('songs', id);
    this.songs.set(this.songs().filter((song) => song.id !== id));
    if (this.selectedSong()?.id === id) {
      this.selectedSong.set(null);
    }
  }

}
