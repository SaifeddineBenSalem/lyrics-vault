import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExportImportService } from '../../core/services/export-import.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPageComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly exporter = inject(ExportImportService);
  private readonly notification = inject(NotificationService);

  readonly settings = this.settingsService.settings;

  async saveSettings(): Promise<void> {
    const current = this.settings();
    if (!current) {
      return;
    }

    await this.settingsService.saveSettings(current);
    this.notification.success('Settings saved');
  }

  async exportVault(): Promise<void> {
    try {
      const payload = await this.exporter.exportVault();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `lyric-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      this.notification.success('Backup exported');
    } catch {
      this.notification.error('Export failed');
    }
  }

  async importVault(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      await this.exporter.importVault(text);
      this.notification.success('Backup imported');
    } catch {
      this.notification.error('Invalid backup file');
    }
  }
}
