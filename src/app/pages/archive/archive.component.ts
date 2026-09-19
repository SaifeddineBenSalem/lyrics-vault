import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SongService } from '../../core/services/song.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivePageComponent {
  private readonly songService = inject(SongService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  readonly songs = this.songService.songs;

  readonly archivedSongs = computed(() => this.songs().filter((song) => song.status === 'archived'));

  constructor() {
    void this.songService.loadAll();
  }

  openSong(songId: string): void {
    void this.router.navigate(['/songs', songId]);
  }

  async restoreSong(songId: string): Promise<void> {
    if (!window.confirm('Restore this song to the active Songs list?')) {
      return;
    }
    await this.songService.restore(songId);
    this.notificationService.success('Song restored');
  }

  async deletePermanently(songId: string, title: string): Promise<void> {
    const confirmed = window.confirm(`DELETE PERMANENTLY?\n\nThis will permanently remove:\n\n• ${title}\n• Lyrics\n• Versions\n• History\n• Local audio\n• Album relationship\n\nThis action cannot be undone.`);
    if (!confirmed) {
      return;
    }
    await this.songService.deletePermanently(songId);
    this.notificationService.success('Song permanently deleted');
  }
}
