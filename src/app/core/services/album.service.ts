import { Injectable, signal } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Album, AlbumStatus, createDefaultAlbum, normalizeAlbum } from '../models/album.model';
import { SongService } from './song.service';

@Injectable({ providedIn: 'root' })
export class AlbumService {
  readonly albums = signal<Album[]>([]);

  constructor(
    private readonly database: DatabaseService,
    private readonly songService: SongService
  ) {}

  async loadAll(): Promise<Album[]> {
    const albums = (await this.database.getAll<Album>('albums')).map((album) => normalizeAlbum(album));
    const sorted = albums.sort((a, b) => b.updatedAt - a.updatedAt);
    this.albums.set(sorted);
    return sorted;
  }

  async getAlbums(): Promise<Album[]> {
    return this.loadAll();
  }

  async getAlbum(id: string): Promise<Album | undefined> {
    const album = await this.database.get<Album>('albums', id);
    return album ? normalizeAlbum(album) : undefined;
  }

  async createAlbum(details: Partial<Album>): Promise<Album> {
    const album = createDefaultAlbum(details);
    await this.database.add('albums', album);
    this.albums.set([album, ...this.albums()]);
    return album;
  }

  async create(details: Partial<Album>): Promise<Album> {
    return this.createAlbum(details);
  }

  async updateAlbum(id: string, details: Partial<Album>): Promise<Album> {
    const existing = await this.getAlbum(id);
    if (!existing) {
      throw new Error('Album not found');
    }
    const album = normalizeAlbum({ ...existing, ...details, id, updatedAt: Date.now() });
    await this.database.update('albums', album);
    this.albums.set(this.albums().map((item) => item.id === id ? album : item));
    return album;
  }

  async update(id: string, details: Partial<Album>): Promise<Album> {
    return this.updateAlbum(id, details);
  }

  async deleteAlbum(id: string): Promise<void> {
    const album = await this.getAlbum(id);
    await this.database.delete('albums', id);
    this.albums.set(this.albums().filter((item) => item.id !== id));
    if (album) {
      const songs = await this.songService.getSongs();
      await Promise.all(album.songIds.map(async (songId) => {
        const song = songs.find((item) => item.id === songId);
        if (song?.albumId === id) {
          await this.songService.save({ ...song, albumId: null });
        }
      }));
    }
  }

  async delete(id: string): Promise<void> {
    return this.deleteAlbum(id);
  }

  async addSongToAlbum(albumId: string, songId: string): Promise<Album> {
    const album = await this.getAlbum(albumId);
    if (!album) {
      throw new Error('Album not found');
    }
    const songs = await this.songService.getSongs();
    const song = songs.find((item) => item.id === songId);
    if (!song) {
      throw new Error('Song not found');
    }

    if (song.albumId && song.albumId !== albumId) {
      const previous = await this.getAlbum(song.albumId);
      if (previous) {
        await this.updateAlbum(previous.id, { songIds: previous.songIds.filter((id) => id !== songId) });
      }
    }

    const updated = await this.updateAlbum(albumId, { songIds: [...album.songIds.filter((id) => id !== songId), songId] });
    if (song.albumId !== albumId) {
      await this.songService.save({ ...song, albumId });
    }
    return updated;
  }

  async removeSongFromAlbum(albumId: string, songId: string): Promise<Album> {
    const album = await this.getAlbum(albumId);
    if (!album) {
      throw new Error('Album not found');
    }
    const updated = await this.updateAlbum(albumId, { songIds: album.songIds.filter((id) => id !== songId) });
    const song = (await this.songService.getSongs()).find((item) => item.id === songId);
    if (song?.albumId === albumId) {
      await this.songService.save({ ...song, albumId: null });
    }
    return updated;
  }

  async reorderAlbumSongs(albumId: string, songIds: string[]): Promise<Album> {
    const album = await this.getAlbum(albumId);
    if (!album) {
      throw new Error('Album not found');
    }
    const allowed = new Set(album.songIds);
    const ordered = [...songIds.filter((id) => allowed.has(id)), ...album.songIds.filter((id) => !songIds.includes(id))];
    return this.updateAlbum(albumId, { songIds: ordered });
  }

  async setSongAlbum(songId: string, albumId: string | null): Promise<void> {
    const songs = await this.songService.getSongs();
    const song = songs.find((item) => item.id === songId);
    if (!song) {
      return;
    }
    if (song.albumId && song.albumId !== albumId) {
      const previous = await this.getAlbum(song.albumId);
      if (previous) {
        await this.updateAlbum(previous.id, { songIds: previous.songIds.filter((id) => id !== songId) });
      }
    }
    if (albumId) {
      await this.addSongToAlbum(albumId, songId);
    } else {
      await this.songService.save({ ...song, albumId: null });
    }
  }

  statusLabel(status: AlbumStatus): string {
    return status;
  }
}
