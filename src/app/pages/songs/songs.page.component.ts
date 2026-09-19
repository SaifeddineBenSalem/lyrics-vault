import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlbumService } from '../../core/services/album.service';
import { SearchService } from '../../core/services/search.service';
import { SongService } from '../../core/services/song.service';
import { SONG_GENRES, SONG_KEYS, SONG_LANGUAGES, SONG_MOODS, SONG_TIME_SIGNATURES, Song } from '../../core/models/song.model';

@Component({
  selector: 'app-songs-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './songs.page.component.html',
  styleUrl: './songs.page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongsPageComponent {
  private readonly songService = inject(SongService);
  private readonly searchService = inject(SearchService);
  private readonly albumService = inject(AlbumService);
  private readonly router = inject(Router);

  readonly songs = this.songService.songs;
  readonly albums = this.albumService.albums;
  readonly filters = this.searchService.filters;
  readonly query = this.searchService.query;
  readonly filteredSongs = computed(() => {
    const list = this.songs().filter((song) => song.status !== 'archived');
    const search = this.searchService.matches();
    return search(list);
  });

  sortMode = 'updated';
  viewMode: 'grid' | 'list' = 'grid';
  readonly genreOptions = [...SONG_GENRES];
  readonly keyOptions = [...SONG_KEYS];
  readonly timeSignatureOptions = [...SONG_TIME_SIGNATURES];
  readonly languageOptions = [...SONG_LANGUAGES];
  readonly moodOptions = [...SONG_MOODS];
  tagInput = '';
  newSong = {
    title: 'Untitled Song',
    artist: 'New Artist',
    subGenre: '',
    bpm: 120,
    key: 'No Key',
    timeSignature: '4/4',
    language: 'English',
    genre: 'Hip-Hop',
    status: 'writing' as Song['status'],
    mood: ['Dreamy'] as string[],
    tags: [] as string[],
    notes: '',
    albumId: null as string | null
  };

  constructor() {
    void this.albumService.loadAll();
  }

  setQuery(value: string): void {
    this.searchService.setQuery(value);
  }

  changeBpm(delta: number): void {
    const next = Math.min(300, Math.max(20, Number(this.newSong.bpm ?? 120) + delta));
    this.newSong.bpm = next;
  }

  toggleMood(mood: string): void {
    const exists = this.newSong.mood.includes(mood);
    this.newSong.mood = exists ? this.newSong.mood.filter((item) => item !== mood) : [...this.newSong.mood, mood];
  }

  addTag(): void {
    const value = this.tagInput.trim();
    if (!value) {
      return;
    }
    if (!this.newSong.tags.includes(value)) {
      this.newSong.tags = [...this.newSong.tags, value];
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.newSong.tags = this.newSong.tags.filter((item) => item !== tag);
  }

  openSong(song: Song): void {
    void this.router.navigate(['/songs', song.id]);
  }

  async archiveSong(song: Song, event: Event): Promise<void> {
    event.stopPropagation();
    await this.songService.archive(song.id);
  }

  toggleFavorite(song: Song, event: Event): void {
    event.stopPropagation();
    void this.songService.save({ ...song, favorite: !song.favorite });
  }

  async createSong(): Promise<void> {
    const song = await this.songService.create({
      title: 'Untitled Song',
      artist: 'New Artist',
      genre: 'Hip-Hop',
      subGenre: 'Mainstream',
      bpm: 120,
      key: 'No Key',
      timeSignature: '4/4',
      language: 'English',
      status: 'writing',
      mood: ['Dreamy'],
      tags: [],
      notes: ''
    });
    void this.router.navigate(['/songs', song.id]);
  }

  async createSongFromQuickForm(): Promise<void> {
    const title = this.newSong.title.trim() || 'Untitled Song';
    const artist = this.newSong.artist.trim() || 'New Artist';
    const bpm = Math.min(300, Math.max(20, Number(this.newSong.bpm ?? 120)));
    const song = await this.songService.create({
      title,
      artist,
      genre: this.newSong.genre || 'Hip-Hop',
      subGenre: this.newSong.subGenre.trim() || 'Mainstream',
      bpm,
      key: this.newSong.key || 'No Key',
      timeSignature: this.newSong.timeSignature || '4/4',
      language: this.newSong.language || 'English',
      status: this.newSong.status,
      mood: this.newSong.mood.length ? this.newSong.mood : ['Dreamy'],
      tags: this.newSong.tags,
      notes: this.newSong.notes || ''
    });
    if (this.newSong.albumId) {
      await this.albumService.addSongToAlbum(this.newSong.albumId, song.id);
    }
    void this.router.navigate(['/songs', song.id]);
  }

  get filteredList(): Song[] {
    const items = [...this.filteredSongs()];
    if (this.sortMode === 'alphabetical') {
      return items.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (this.sortMode === 'created') {
      return items.sort((a, b) => b.createdAt - a.createdAt);
    }
    if (this.sortMode === 'bpm') {
      return items.sort((a, b) => b.bpm - a.bpm);
    }
    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
