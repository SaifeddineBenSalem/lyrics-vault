import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { SongService } from '../../core/services/song.service';
import { AlbumService } from '../../core/services/album.service';
import { SearchService } from '../../core/services/search.service';
import { VersionService } from '../../core/services/version.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { RhymeService } from '../../core/services/rhyme.service';
import { AudioService } from '../../core/services/audio.service';
import { AudioRecord } from '../../core/models/audio.model';
import { SONG_GENRES, SONG_KEYS, SONG_LANGUAGES, SONG_MOODS, SONG_STATUS_LABELS, SONG_STATUS_OPTIONS, SONG_TIME_SIGNATURES, Song } from '../../core/models/song.model';
import { LyricSection, SECTION_TYPE_LABELS } from '../../core/models/lyric-section.model';
import { createVersionFromSections, LyricVersion } from '../../core/models/lyric-version.model';
import { countCharacters, countLines, countWords, getAverageWordsPerLine } from '../../core/utils/text.util';

@Component({
  selector: 'app-song-workspace',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, FormsModule, RouterLink],
  templateUrl: './song-workspace.component.html',
  styleUrl: './song-workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongWorkspaceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly songService = inject(SongService);
  private readonly albumService = inject(AlbumService);
  private readonly versionService = inject(VersionService);
  private readonly notificationService = inject(NotificationService);
  private readonly settingsService = inject(SettingsService);
  private readonly rhymeService = inject(RhymeService);
  private readonly audioService = inject(AudioService);
  private readonly searchService = inject(SearchService);

  readonly selectedSong = this.songService.selectedSong;
  readonly versions = this.versionService.versions;
  readonly settings = this.settingsService.settings;
  readonly albums = this.albumService.albums;
  readonly activeTab = signal<'lyrics' | 'structure' | 'rhyme' | 'versions' | 'details' | 'notes' | 'audio' | 'stats'>('lyrics');
  readonly genreOptions = [...SONG_GENRES];
  readonly statusOptions = [...SONG_STATUS_OPTIONS];
  readonly statusLabels = SONG_STATUS_LABELS;
  readonly keyOptions = [...SONG_KEYS];
  readonly timeSignatureOptions = [...SONG_TIME_SIGNATURES];
  readonly languageOptions = [...SONG_LANGUAGES];
  readonly moodOptions = [...SONG_MOODS];
  tagInput = '';
  readonly focusMode = signal(false);
  readonly saveState = signal<'saving' | 'saved' | 'error'>('saved');
  readonly instrumentalAudio = signal<AudioRecord | null>(null);
  readonly instrumentalAudioUrl = signal<string | null>(null);
  readonly viewedVersion = signal<LyricVersion | null>(null);
  readonly backAlbumId = signal<string | null>(null);
  readonly compareFirstId = signal<string>('');
  readonly compareSecondId = signal<string>('');
  versionName = '';
  versionDescription = '';
  instrumentalUrlDraft = '';
  readonly comparedVersions = computed(() => {
    const first = this.versions().find((version) => version.id === this.compareFirstId());
    const second = this.versions().find((version) => version.id === this.compareSecondId());
    if (!first || !second) {
      return null;
    }
    const length = Math.max(first.sections.length, second.sections.length);
    return { first, second, rows: Array.from({ length }, (_, index) => ({
      index,
      first: first.sections[index],
      second: second.sections[index],
      changed: first.sections[index]?.content !== second.sections[index]?.content || first.sections[index]?.name !== second.sections[index]?.name
    })) };
  });
  readonly lyricStats = computed(() => {
    const song = this.selectedSong();
    if (!song) {
      return { words: 0, characters: 0, lines: 0, avgWords: 0, sections: 0 };
    }

    const content = song.sections.map((section) => section.content).join('\n');
    return {
      words: countWords(content),
      characters: countCharacters(content),
      lines: countLines(content),
      avgWords: getAverageWordsPerLine(content),
      sections: song.sections.length
    };
  });
  readonly rhymeAnalysis = computed(() => {
    const song = this.selectedSong();
    if (!song) {
      return null;
    }
    return this.rhymeService.analyze(song.sections.map((section) => section.content).join('\n'));
  });

  constructor() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (!id) {
        return;
      }
      const song = await this.songService.getById(id);
      if (!song) {
        this.notificationService.error('Missing song');
        return;
      }
      this.instrumentalUrlDraft = song.instrumentalUrl ?? '';
      await this.loadInstrumentalAudio(song);
      const albumId = this.getAlbumIdFromNavigationState();
      if (albumId) {
        const album = await this.albumService.getAlbum(albumId);
        if (album?.songIds.includes(song.id)) {
          this.backAlbumId.set(album.id);
        }
      }
      await this.versionService.loadForSong(song.id);
    });

    window.addEventListener('keydown', this.handleKeyboard.bind(this));
    void this.albumService.loadAll();
  }

  private async loadInstrumentalAudio(song: Song): Promise<void> {
    const records = await this.audioService.loadForSong(song.id);
    const record = song.instrumentalAudioId ? records.find((item) => item.id === song.instrumentalAudioId) ?? null : null;
    this.setInstrumentalAudio(record);
  }

  private setInstrumentalAudio(record: AudioRecord | null): void {
    const previousUrl = this.instrumentalAudioUrl();
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }
    this.instrumentalAudio.set(record);
    this.instrumentalAudioUrl.set(record ? URL.createObjectURL(record.blob) : null);
  }

  async saveInstrumentalUrl(): Promise<void> {
    const song = this.selectedSong();
    if (!song) {
      return;
    }
    const value = this.instrumentalUrlDraft.trim();
    if (value && !this.isSafeExternalUrl(value)) {
      this.notificationService.error('Enter a valid http or https URL');
      return;
    }
    this.instrumentalUrlDraft = value;
    this.updateSong({ instrumentalUrl: value || undefined });
  }

  clearInstrumentalUrl(): void {
    this.instrumentalUrlDraft = '';
    void this.saveInstrumentalUrl();
  }

  openInstrumental(): void {
    const url = this.selectedSong()?.instrumentalUrl;
    if (url && this.isSafeExternalUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  async uploadInstrumental(event: Event): Promise<void> {
    const song = this.selectedSong();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!song || !file) {
      return;
    }
    try {
      const current = this.instrumentalAudio();
      if (current) {
        await this.audioService.delete(current.id);
      }
      const record = await this.audioService.upload(song.id, file);
      this.setInstrumentalAudio(record);
      this.updateSong({ instrumentalAudioId: record.id });
    } catch {
      this.notificationService.error('Unable to upload instrumental audio');
    } finally {
      input.value = '';
    }
  }

  async removeInstrumentalAudio(): Promise<void> {
    const current = this.instrumentalAudio();
    if (current) {
      await this.audioService.delete(current.id);
    }
    this.setInstrumentalAudio(null);
    this.updateSong({ instrumentalAudioId: null });
  }

  private isSafeExternalUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  goBack(): void {
    const albumId = this.backAlbumId();
    void this.router.navigate(albumId ? ['/albums', albumId] : ['/songs']);
  }

  private getAlbumIdFromNavigationState(): string | null {
    const albumId = history.state?.['albumId'];
    return typeof albumId === 'string' && albumId.trim() ? albumId : null;
  }

  private handleKeyboard(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchService.setQuery('');
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void this.saveSong();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.focusMode.set(!this.focusMode());
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      void this.router.navigate(['/songs']);
    }

    if (event.key === 'Escape' && this.focusMode()) {
      this.focusMode.set(false);
    }
  }

  async saveSong(song = this.selectedSong()): Promise<void> {
    if (!song) {
      return;
    }

    this.saveState.set('saving');
    try {
      await this.songService.save(song);
      this.saveState.set('saved');
      this.notificationService.success('Song saved');
    } catch {
      this.saveState.set('error');
      this.notificationService.error('Error saving');
    }
  }

  toggleFavorite(): void {
    const song = this.selectedSong();
    if (!song) {
      return;
    }

    song.favorite = !song.favorite;
    void this.saveSong();
  }

  changeBpm(song: Song, delta: number): void {
    const next = Math.min(300, Math.max(20, Number(song.bpm ?? 120) + delta));
    this.updateSong({ bpm: next });
  }

  toggleMood(song: Song, mood: string): void {
    const exists = song.mood.includes(mood);
    this.updateSong({ mood: exists ? song.mood.filter((item) => item !== mood) : [...song.mood, mood] });
  }

  addTag(song: Song): void {
    const value = this.tagInput.trim();
    if (!value) {
      return;
    }

    const tags = song.tags.includes(value) ? song.tags : [...song.tags, value];
    this.tagInput = '';
    this.updateSong({ tags });
  }

  removeTag(song: Song, tag: string): void {
    this.updateSong({ tags: song.tags.filter((item) => item !== tag) });
  }

  async setAlbum(song: Song, albumId: string | null): Promise<void> {
    await this.albumService.setSongAlbum(song.id, albumId);
    const updated = await this.songService.getById(song.id);
    if (updated) {
      this.saveState.set('saved');
    }
  }

  updateSong(partial: Partial<Song>): void {
    const current = this.selectedSong();
    if (!current) {
      return;
    }

    const updated = { ...current, ...partial, updatedAt: Date.now() };
    this.songService.selectedSong.set(updated);
    void this.saveSong(updated);
  }

  updateSection(sectionId: string, update: Partial<LyricSection>): void {
    const song = this.selectedSong();
    if (!song) {
      return;
    }

    const target = song.sections.find((section) => section.id === sectionId);
    if (!target) {
      return;
    }

    Object.assign(target, update, { updatedAt: Date.now() });
    song.updatedAt = Date.now();
    void this.saveSong();
  }

  addSection(): void {
    const song = this.selectedSong();
    if (!song) {
      return;
    }
    const section: LyricSection = {
      id: crypto.randomUUID(),
      type: 'custom',
      name: `Section ${song.sections.length + 1}`,
      content: '',
      order: song.sections.length,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    song.sections = [...song.sections, section];
    song.updatedAt = Date.now();
    void this.saveSong();
  }

  duplicateSection(sectionId: string): void {
    const song = this.selectedSong();
    if (!song) {
      return;
    }
    const section = song.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }
    const duplicate: LyricSection = { ...section, id: crypto.randomUUID(), name: `${section.name} Copy`, order: song.sections.length, createdAt: Date.now(), updatedAt: Date.now(), content: section.content };
    song.sections = [...song.sections, duplicate];
    song.updatedAt = Date.now();
    void this.saveSong();
  }

  deleteSection(sectionId: string): void {
    const song = this.selectedSong();
    if (!song) {
      return;
    }
    song.sections = song.sections.filter((section) => section.id !== sectionId);
    song.updatedAt = Date.now();
    void this.saveSong();
  }

  drop(event: CdkDragDrop<LyricSection[]>): void {
    const song = this.selectedSong();
    if (!song) {
      return;
    }
    moveItemInArray(song.sections, event.previousIndex, event.currentIndex);
    song.sections = song.sections.map((section, index) => ({ ...section, order: index, updatedAt: Date.now() }));
    song.updatedAt = Date.now();
    void this.saveSong();
  }

  async saveVersion(): Promise<void> {
    const song = this.selectedSong();
    if (!song) {
      return;
    }
    const version = createVersionFromSections(
      song.id,
      this.versionName.trim() || `V${this.versions().length + 1}`,
      song.sections,
      this.versionDescription.trim() || 'Saved lyric snapshot',
      {
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        subGenre: song.subGenre,
        bpm: song.bpm,
        key: song.key,
        timeSignature: song.timeSignature,
        language: song.language,
        mood: [...song.mood],
        status: song.status
      },
      this.versions()[0]?.id ?? null
    );
    await this.versionService.createVersion(version);
    this.versionName = '';
    this.versionDescription = '';
    this.notificationService.success('Version created');
  }

  viewVersion(version: LyricVersion): void {
    this.viewedVersion.set(version);
  }

  closeVersionViewer(): void {
    this.viewedVersion.set(null);
  }

  async restoreVersion(version: LyricVersion): Promise<void> {
    if (!window.confirm('Restore this version?\n\nYour current lyrics will be replaced by this version.')) {
      return;
    }
    await this.versionService.restoreVersion(version.id);
    const song = this.selectedSong();
    if (song) {
      await this.versionService.loadForSong(song.id);
    }
    this.notificationService.success(`${version.name} restored`);
  }

  async renameVersion(version: LyricVersion): Promise<void> {
    const name = window.prompt('Rename version', version.name)?.trim();
    if (!name || name === version.name) {
      return;
    }
    await this.versionService.updateVersion(version.id, { name });
  }

  async deleteVersion(version: LyricVersion): Promise<void> {
    if (!window.confirm(`Delete ${version.name}?`)) {
      return;
    }
    await this.versionService.deleteVersion(version.id);
    if (this.viewedVersion()?.id === version.id) {
      this.closeVersionViewer();
    }
    this.notificationService.success('Version deleted');
  }

  compareVersions(): void {
    if (!this.compareFirstId() || !this.compareSecondId()) {
      return;
    }
  }

  formatVersionTime(value: number): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(value);
  }

  getParentVersionName(version: LyricVersion): string {
    return version.parentVersionId
      ? this.versions().find((item) => item.id === version.parentVersionId)?.name ?? 'Previous version'
      : 'Root version';
  }

  getChangedSectionCount(): number {
    return this.comparedVersions()?.rows.filter((row) => row.changed).length ?? 0;
  }

  getComparedSectionName(section: LyricSection | undefined, fallback: string): string {
    return section?.name || fallback;
  }

  getComparedSectionContent(section: LyricSection | undefined): string {
    return section?.content || 'No content';
  }

  getSectionLabel(type: LyricSection['type']): string {
    return SECTION_TYPE_LABELS[type];
  }
}
