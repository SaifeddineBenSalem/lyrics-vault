import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bpm-lab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bpm-lab.component.html',
  styleUrl: './bpm-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BpmLabComponent {
  bpm = signal(120);
  taps = signal<number[]>([]);
  average = signal(120);
  beatsPerMeasure = 4;
  isPlaying = false;
  accentFirstBeat = true;
  volume = 0.7;
  private audioContext: AudioContext | null = null;

  readonly tapInfo = computed(() => this.taps().slice(-8));

  setBpm(value: number): void {
    this.bpm.set(Math.max(40, Math.min(220, value)));
  }

  increase(): void {
    this.setBpm(this.bpm() + 1);
  }

  decrease(): void {
    this.setBpm(this.bpm() - 1);
  }

  tapTempo(): void {
    const now = Date.now();
    const previous = this.taps();
    const last = previous[previous.length - 1] ?? now;
    const diff = now - last;
    const nextTaps = [...previous, now].slice(-8);
    this.taps.set(nextTaps);

    if (diff > 0 && diff < 4000) {
      const computed = Math.round(60000 / diff);
      this.average.set(Math.round(nextTaps.reduce((sum, value, index, arr) => {
        if (index === 0) {
          return sum;
        }
        const delta = value - arr[index - 1];
        return sum + (delta > 0 && delta < 4000 ? 60000 / delta : 0);
      }, 0) / Math.max(1, nextTaps.length - 1)));
      this.setBpm(computed);
      return;
    }

    this.average.set(this.bpm());
  }

  resetTaps(): void {
    this.taps.set([]);
    this.average.set(this.bpm());
  }

  toggleMetronome(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.scheduleLoop();
    }
  }

  private scheduleLoop(): void {
    if (!this.isPlaying) {
      return;
    }

    const intervalMs = 60000 / this.bpm();
    const startAt = this.audioContext!.currentTime + 0.05;
    const oscillator = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = this.accentFirstBeat ? 900 : 620;
    gain.gain.value = this.volume * 0.25;
    oscillator.connect(gain);
    gain.connect(this.audioContext!.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.04);

    window.setTimeout(() => this.scheduleLoop(), intervalMs);
  }
}
