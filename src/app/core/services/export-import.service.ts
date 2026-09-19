import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { AppSettings } from '../models/app-settings.model';
import { AudioRecord } from '../models/audio.model';
import { Album } from '../models/album.model';
import { HistoryEntry } from '../models/history.model';
import { LyricVersion } from '../models/lyric-version.model';
import { Song } from '../models/song.model';
import { Tag } from '../models/tag.model';

export interface VaultExportPayload {
  version: number;
  exportedAt: number;
  songs: Song[];
  versions: LyricVersion[];
  tags: Tag[];
  history: HistoryEntry[];
  settings: AppSettings[];
  audio: AudioRecord[];
  albums: Album[];
}

@Injectable({ providedIn: 'root' })
export class ExportImportService {
  constructor(private readonly database: DatabaseService) {}

  async exportVault(): Promise<VaultExportPayload> {
    const [songs, versions, tags, history, settings, audio, albums] = await Promise.all([
      this.database.getAll<Song>('songs'),
      this.database.getAll<LyricVersion>('versions'),
      this.database.getAll<Tag>('tags'),
      this.database.getAll<HistoryEntry>('history'),
      this.database.getAll<AppSettings>('settings'),
      this.database.getAll<AudioRecord>('audio'),
      this.database.getAll<Album>('albums')
    ]);

    return {
      version: 1,
      exportedAt: Date.now(),
      songs,
      versions,
      tags,
      history,
      settings,
      audio,
      albums
    };
  }

  async exportSong(song: Song): Promise<string> {
    return JSON.stringify({ song, exportedAt: Date.now() }, null, 2);
  }

  async exportLyricsAsTxt(song: Song): Promise<string> {
    return song.sections.map((section) => `${section.name}\n${section.content}`).join('\n\n');
  }

  async importVault(json: string): Promise<{ songs: Song[]; versions: LyricVersion[]; tags: Tag[]; history: HistoryEntry[]; settings: AppSettings[]; audio: AudioRecord[]; albums: Album[] }> {
    let parsed: Partial<VaultExportPayload>;

    try {
      parsed = JSON.parse(json) as Partial<VaultExportPayload>;
    } catch {
      throw new Error('Invalid JSON import');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Corrupt backup data');
    }

    const songs = Array.isArray(parsed.songs) ? parsed.songs : [];
    const versions = Array.isArray(parsed.versions) ? parsed.versions : [];
    const tags = Array.isArray(parsed.tags) ? parsed.tags : [];
    const history = Array.isArray(parsed.history) ? parsed.history : [];
    const settings = Array.isArray(parsed.settings) ? parsed.settings : [];
    const audio = Array.isArray(parsed.audio) ? parsed.audio : [];
    const albums = Array.isArray(parsed.albums) ? parsed.albums : [];

    for (const song of songs) {
      await this.database.add('songs', song);
    }
    for (const version of versions) {
      await this.database.add('versions', version);
    }
    for (const tag of tags) {
      await this.database.add('tags', tag);
    }
    for (const entry of history) {
      await this.database.add('history', entry);
    }
    for (const setting of settings) {
      await this.database.add('settings', setting);
    }
    for (const item of audio) {
      await this.database.add('audio', item);
    }
    for (const album of albums) {
      await this.database.add('albums', album);
    }

    return { songs, versions, tags, history, settings, audio, albums };
  }
}
