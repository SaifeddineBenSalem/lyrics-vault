import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DatabaseService } from '../../core/database/database.service';
import { Song } from '../../core/models/song.model';
import { Album } from '../../core/models/album.model';
import { AlbumService } from '../../core/services/album.service';
import { SettingsService } from '../../core/services/settings.service';
import { SongService } from '../../core/services/song.service';
import { SearchService } from '../../core/services/search.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent {
  private readonly router = inject(Router);
  private readonly database = inject(DatabaseService);
  private readonly songService = inject(SongService);
  private readonly albumService = inject(AlbumService);
  private readonly settingsService = inject(SettingsService);
  private readonly searchService = inject(SearchService);

  readonly songs = this.songService.songs;
  readonly selectedSong = this.songService.selectedSong;
  readonly albums = this.albumService.albums;
  readonly query = this.searchService.query;
  readonly filteredSongs = computed(() => {
    const list = this.songs();
    const raw = this.query();
    if (!raw.trim()) {
      return list;
    }
    return list.filter((song) => `${song.title} ${song.artist} ${song.genre} ${song.notes}`.toLowerCase().includes(raw.toLowerCase()));
  });
  readonly filteredAlbums = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.albums().filter((album) => !query || `${album.name} ${album.artist} ${album.genre} ${album.description}`.toLowerCase().includes(query));
  });

  readonly theme = signal<'dark' | 'light' | 'system'>('dark');
  readonly resolvedTheme = computed(() => {
    const mode = this.theme();
    if (mode === 'system') {
      if (typeof window === 'undefined') {
        return 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    return mode;
  });

  constructor() {
    this.init();

    effect(() => {
      const settings = this.settingsService.settings();
      if (settings) {
        this.theme.set(settings.theme);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const theme = this.resolvedTheme();
      if (typeof document !== 'undefined') {
        document.body.setAttribute('data-theme', theme);
      }
    });
  }

  async init(): Promise<void> {
    await this.settingsService.init();
    const songs = await this.songService.loadAll();
    await this.albumService.loadAll();
    if (songs[0]) {
      this.songService.selectedSong.set(songs[0]);
    }
  }

  onGlobalSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchService.setQuery(input.value);
  }

  navigateToSelectedSong(): void {
    const song = this.selectedSong();
    if (song) {
      void this.router.navigate(['/songs', song.id]);
    }
  }

  navigateToAlbum(album: Album): void {
    void this.router.navigate(['/albums', album.id]);
  }

  async saveCurrentSong(): Promise<void> {
    const song = this.selectedSong();
    if (!song) {
      return;
    }
    await this.songService.save(song);
  }

  openCreateSong(): void {
    void this.router.navigate(['/songs']);
  }

  trackBySong = (index: number, song: Song): string => song.id;
}
