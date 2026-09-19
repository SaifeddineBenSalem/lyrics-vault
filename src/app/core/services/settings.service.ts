import { Injectable, computed, signal } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { AppSettings, createDefaultSettings } from '../models/app-settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly settingsSignal = signal<AppSettings | null>(null);
  readonly settings = computed(() => this.settingsSignal());

  constructor(private readonly database: DatabaseService) {}

  async init(): Promise<void> {
    const existing = await this.database.get<AppSettings>('settings', 'app-settings');
    const next = existing ?? createDefaultSettings();
    this.settingsSignal.set(next);
  }

  async saveSettings(next: AppSettings): Promise<void> {
    const payload = { ...next, updatedAt: Date.now() };
    await this.database.add('settings', payload);
    this.settingsSignal.set(payload);
  }

  async update(partial: Partial<AppSettings>): Promise<void> {
    const current = this.settingsSignal() ?? createDefaultSettings();
    await this.saveSettings({ ...current, ...partial, updatedAt: Date.now() });
  }
}
