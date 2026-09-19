import { Injectable, signal } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { LyricVersion, normalizeLyricVersion } from '../models/lyric-version.model';
import { SongService } from './song.service';

@Injectable({ providedIn: 'root' })
export class VersionService {
  readonly versions = signal<LyricVersion[]>([]);

  constructor(
    private readonly database: DatabaseService,
    private readonly songService: SongService
  ) {}

  async loadForSong(songId: string): Promise<LyricVersion[]> {
    const allVersions = await this.database.getAll<LyricVersion>('versions');
    const filtered = allVersions.filter((version) => version.songId === songId).map((version) => normalizeLyricVersion(version)).sort((a, b) => b.createdAt - a.createdAt);
    this.versions.set(filtered);
    return filtered;
  }

  async save(version: LyricVersion): Promise<LyricVersion> {
    const normalized = normalizeLyricVersion(version);
    await this.database.add('versions', normalized);
    this.versions.set([...this.versions().filter((item) => item.id !== normalized.id), normalized].sort((a, b) => b.createdAt - a.createdAt));
    return normalized;
  }

  async createVersion(version: LyricVersion): Promise<LyricVersion> {
    return this.save(version);
  }

  async getVersionsForSong(songId: string): Promise<LyricVersion[]> {
    return this.loadForSong(songId);
  }

  async getVersion(id: string): Promise<LyricVersion | undefined> {
    const version = await this.database.get<LyricVersion>('versions', id);
    return version ? normalizeLyricVersion(version) : undefined;
  }

  async updateVersion(id: string, changes: Partial<LyricVersion>): Promise<LyricVersion> {
    const existing = await this.getVersion(id);
    if (!existing) {
      throw new Error('Version not found');
    }
    return this.save(normalizeLyricVersion({ ...existing, ...changes, id }));
  }

  async delete(id: string): Promise<void> {
    await this.database.delete('versions', id);
    this.versions.set(this.versions().filter((version) => version.id !== id));
  }

  async deleteVersion(id: string): Promise<void> {
    return this.delete(id);
  }

  async restoreVersion(id: string): Promise<LyricVersion> {
    const version = await this.getVersion(id);
    if (!version) {
      throw new Error('Version not found');
    }
    const song = await this.songService.getById(version.songId);
    if (!song) {
      throw new Error('Song not found');
    }
    await this.songService.save({
      ...song,
      title: version.metadata.title,
      artist: version.metadata.artist,
      genre: version.metadata.genre,
      subGenre: version.metadata.subGenre,
      bpm: version.metadata.bpm,
      key: version.metadata.key,
      timeSignature: version.metadata.timeSignature,
      language: version.metadata.language,
      mood: [...version.metadata.mood],
      status: version.metadata.status,
      sections: version.sections.map((section) => ({ ...section })),
      updatedAt: Date.now()
    });
    return version;
  }
}
