import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SongService } from '../../core/services/song.service';
import { StatisticsService } from '../../core/services/statistics.service';
import { formatDate } from '../../core/utils/date.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly songService = inject(SongService);
  private readonly statsService = inject(StatisticsService);

  readonly songs = this.songService.songs;
  readonly stats = computed(() => this.statsService.getDashboardStats(this.songs()));
  readonly recentSongs = computed(() => this.songs().filter((song) => song.status !== 'archived').slice(0, 4));

  getFormattedDate(value: number): string {
    return formatDate(value);
  }
}
