import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RhymeService } from '../../core/services/rhyme.service';

@Component({
  selector: 'app-rhyme-lab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rhyme-lab.component.html',
  styleUrl: './rhyme-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RhymeLabComponent {
  readonly analysis = signal<any>(null);
  text = `Night falls, the city breathes\nI keep moving through the light\nA rhythm in the rain\nThe fire in my dreams tonight`;

  constructor(private readonly rhymeService: RhymeService) {
    this.analyze();
  }

  analyze(): void {
    this.analysis.set(this.rhymeService.analyze(this.text));
  }
}
