import { Injectable, computed, signal } from '@angular/core';
import { Song } from '../models/song.model';

export interface SongFilters {
  status?: string;
  genre?: string;
  bpmMin?: number;
  bpmMax?: number;
  favorite?: boolean;
  tags?: string[];
  query?: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly filters = signal<SongFilters>({});
  readonly query = signal<string>('');

  readonly matches = computed(() => {
    const { query: rawQuery = '', ...rest } = this.filters();
    const query = rawQuery.trim().toLowerCase();

    return (songs: Song[]) => songs.filter((song) => {
      const haystack = [
        song.title,
        song.artist,
        song.genre,
        song.subGenre,
        song.mood,
        song.status,
        song.notes,
        song.tags.join(' '),
        song.sections.map((section) => section.content).join(' ')
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query);
      const matchesStatus = !rest.status || rest.status === 'all' || song.status === rest.status;
      const matchesGenre = !rest.genre || rest.genre === 'all' || song.genre.toLowerCase() === rest.genre.toLowerCase();
      const matchesBpm = (!rest.bpmMin || song.bpm >= rest.bpmMin) && (!rest.bpmMax || song.bpm <= rest.bpmMax);
      const matchesFavorite = rest.favorite === undefined || song.favorite === rest.favorite;
      const matchesTags = !rest.tags?.length || rest.tags.every((tag) => song.tags.includes(tag));

      return matchesQuery && matchesStatus && matchesGenre && matchesBpm && matchesFavorite && matchesTags;
    });
  });

  setQuery(value: string): void {
    this.query.set(value);
    this.filters.set({ ...this.filters(), query: value });
  }

  setFilters(filters: SongFilters): void {
    this.filters.set({ ...this.filters(), ...filters });
  }
}
