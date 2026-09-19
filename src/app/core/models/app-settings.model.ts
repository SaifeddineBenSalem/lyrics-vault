export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppSettings {
  readonly id: string;
  theme: ThemeMode;
  editorFontSize: number;
  editorLineSpacing: number;
  editorLineNumbers: boolean;
  autosaveEnabled: boolean;
  metronomeVolume: number;
  accentBeat: boolean;
  defaultBpm: number;
  createdAt: number;
  updatedAt: number;
}

export const createDefaultSettings = (): AppSettings => ({
  id: 'app-settings',
  theme: 'dark',
  editorFontSize: 16,
  editorLineSpacing: 1.5,
  editorLineNumbers: true,
  autosaveEnabled: true,
  metronomeVolume: 0.7,
  accentBeat: true,
  defaultBpm: 120,
  createdAt: Date.now(),
  updatedAt: Date.now()
});
