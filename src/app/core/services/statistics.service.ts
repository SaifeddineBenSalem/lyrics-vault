import { Injectable } from '@angular/core';
import { Song } from '../models/song.model';
import { countWords, countLines } from '../utils/text.util';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  getDashboardStats(songs: Song[]): { total: number; active: number; drafts: number; released: number; favorites: number; archived: number } {
    return {
      total: songs.length,
      active: songs.filter((song) => song.status !== 'archived').length,
      drafts: songs.filter((song) => song.status === 'writing' || song.status === 'idea' || song.status === 'demo').length,
      released: songs.filter((song) => song.status === 'released' || song.status === 'ready').length,
      favorites: songs.filter((song) => song.favorite).length,
      archived: songs.filter((song) => song.status === 'archived').length
    };
  }

  getSongMetrics(song: Song): { sections: number; lines: number; words: number; versions: number } {
    const lines = song.sections.reduce((sum, section) => sum + countLines(section.content), 0);
    const words = song.sections.reduce((sum, section) => sum + countWords(section.content), 0);
    return {
      sections: song.sections.length,
      lines,
      words,
      versions: 0
    };
  }
}
