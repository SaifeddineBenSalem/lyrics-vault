import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Album } from '../../core/models/album.model';
import { DatabaseService } from '../../core/database/database.service';
import { AudioRecord } from '../../core/models/audio.model';
import { Song } from '../../core/models/song.model';
import { AlbumService } from '../../core/services/album.service';
import { SongService } from '../../core/services/song.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-album-details',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, RouterLink],
  templateUrl: './album-details.component.html',
  styleUrl: './album-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlbumDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly albumService = inject(AlbumService);
  private readonly songService = inject(SongService);
  private readonly database = inject(DatabaseService);
  private readonly notificationService = inject(NotificationService);

  readonly album = signal<Album | null>(null);
  readonly songs = this.songService.songs;
  readonly tracks = computed(() => {
    const current = this.album();
    const available = this.songs();
    return current ? current.songIds.map((id) => available.find((song) => song.id === id)).filter((song): song is Song => Boolean(song)) : [];
  });
  readonly averageBpm = computed(() => {
    const tracks = this.tracks();
    return tracks.length ? Math.round(tracks.reduce((sum, song) => sum + song.bpm, 0) / tracks.length) : 0;
  });
  readonly genres = computed(() => [...new Set(this.tracks().map((song) => song.genre))].join(', ') || this.album()?.genre || 'Other');
  readonly totalDuration = signal(0);
  readonly addTracksOpen = signal(false);
  readonly selectedTrackIds = signal<string[]>([]);
  readonly trackCandidates = computed(() => {
    const current = this.album();
    return this.songs().map((song) => ({
      song,
      isInThisAlbum: current?.songIds.includes(song.id) ?? false,
      assignedAlbum: song.albumId && song.albumId !== current?.id
        ? this.albumService.albums().find((album) => album.id === song.albumId)
        : undefined
    }));
  });

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        await this.songService.loadAll();
        this.album.set(await this.albumService.getAlbum(id) ?? null);
        const audio = await this.database.getAll<AudioRecord>('audio');
        const trackIds = new Set(this.album()?.songIds ?? []);
        this.totalDuration.set(audio.filter((item) => trackIds.has(item.songId)).reduce((sum, item) => sum + (item.duration || 0), 0));
      }
    });
  }

  async drop(event: CdkDragDrop<Song[]>): Promise<void> {
    const current = this.album();
    if (!current || event.previousIndex === event.currentIndex) {
      return;
    }
    const ids = [...current.songIds];
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this.album.set(await this.albumService.reorderAlbumSongs(current.id, ids));
  }

  async removeSong(song: Song): Promise<void> {
    const current = this.album();
    if (current) {
      this.album.set(await this.albumService.removeSongFromAlbum(current.id, song.id));
    }
  }

  openAddTracks(): void {
    this.selectedTrackIds.set([]);
    this.addTracksOpen.set(true);
  }

  closeAddTracks(): void {
    this.addTracksOpen.set(false);
    this.selectedTrackIds.set([]);
  }

  openEdit(album: Album): void {
    void this.router.navigate(['/albums'], { queryParams: { edit: album.id } });
  }

  toggleTrackSelection(songId: string): void {
    const selected = this.selectedTrackIds();
    this.selectedTrackIds.set(selected.includes(songId) ? selected.filter((id) => id !== songId) : [...selected, songId]);
  }

  async addSelectedTracks(): Promise<void> {
    const current = this.album();
    if (!current || !this.selectedTrackIds().length) {
      return;
    }

    try {
      let updated = current;
      for (const songId of this.selectedTrackIds()) {
        updated = await this.albumService.addSongToAlbum(current.id, songId);
      }
      this.album.set(updated);
      this.closeAddTracks();
      this.notificationService.success('Tracks added to album');
    } catch {
      this.notificationService.error('Unable to add one or more tracks');
    }
  }
}
