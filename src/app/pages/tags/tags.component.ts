import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SongService } from '../../core/services/song.service';

@Component({
  selector: 'app-tags-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsPageComponent {
  private readonly songService = inject(SongService);
  readonly songs = this.songService.songs;
  readonly tags = computed(() => {
    const counts = new Map<string, number>();
    for (const song of this.songs()) {
      for (const tag of song.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  });

  constructor() {
    void this.songService.loadAll();
  }
}
