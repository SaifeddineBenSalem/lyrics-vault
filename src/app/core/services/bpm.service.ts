import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BpmService {
  readonly currentBpm = signal<number>(120);
  readonly taps = signal<number[]>([]);
  readonly averageBpm = signal<number>(120);

  setBpm(value: number): void {
    const bpm = Math.max(40, Math.min(220, value));
    this.currentBpm.set(bpm);
  }

  increase(): void {
    this.setBpm(this.currentBpm() + 1);
  }

  decrease(): void {
    this.setBpm(this.currentBpm() - 1);
  }

  tap(): number {
    const now = Date.now();
    const previous = this.taps();
    const last = previous[previous.length - 1] ?? now;
    const diff = now - last;

    if (diff > 0 && diff < 4000) {
      const candidate = Math.round((60000 / diff) * 10) / 10;
      const next = [...previous, now];
      this.taps.set(next.slice(-8));
      const avg = this.computeAverage(next);
      this.averageBpm.set(avg);
      this.setBpm(Math.round(avg));
      return candidate;
    }

    const next = [...previous, now];
    this.taps.set(next.slice(-8));
    this.averageBpm.set(this.computeAverage(next));
    this.setBpm(this.computeAverage(next));
    return this.currentBpm();
  }

  resetTaps(): void {
    this.taps.set([]);
    this.averageBpm.set(this.currentBpm());
  }

  private computeAverage(values: number[]): number {
    if (values.length < 2) {
      return this.currentBpm();
    }

    const intervals: number[] = [];
    for (let i = 1; i < values.length; i += 1) {
      const diff = values[i] - values[i - 1];
      if (diff > 0 && diff < 4000) {
        intervals.push(diff);
      }
    }

    if (!intervals.length) {
      return this.currentBpm();
    }

    const averageInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    return Math.round(60000 / averageInterval);
  }
}
