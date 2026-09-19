import { Injectable, signal } from '@angular/core';
import { AudioRecord } from '../models/audio.model';
import { DatabaseService } from '../database/database.service';

@Injectable({ providedIn: 'root' })
export class AudioService {
  readonly audioList = signal<AudioRecord[]>([]);

  constructor(private readonly database: DatabaseService) {}

  async loadForSong(songId: string): Promise<AudioRecord[]> {
    const all = await this.database.getAll<AudioRecord>('audio');
    const filtered = all.filter((entry) => entry.songId === songId);
    this.audioList.set(filtered);
    return filtered;
  }

  async upload(songId: string, file: File): Promise<AudioRecord> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedExtensions = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac']);
    if (!file.type.startsWith('audio/') && !supportedExtensions.has(extension ?? '')) {
      throw new Error('Unsupported audio type');
    }

    const record: AudioRecord = {
      id: crypto.randomUUID(),
      songId,
      name: file.name,
      blob: file,
      mimeType: file.type,
      duration: 0,
      createdAt: Date.now()
    };

    await this.database.add('audio', record);
    this.audioList.set([...this.audioList(), record]);
    return record;
  }

  async delete(id: string): Promise<void> {
    await this.database.delete('audio', id);
    this.audioList.set(this.audioList().filter((item) => item.id !== id));
  }
}
