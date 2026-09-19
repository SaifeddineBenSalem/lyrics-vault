import { CommonModule } from '@angular/common';
import { ElementRef, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ALBUM_STATUSES, Album, AlbumStatus } from '../../core/models/album.model';
import { SONG_GENRES } from '../../core/models/song.model';
import { AlbumService } from '../../core/services/album.service';

@Component({
  selector: 'app-albums-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './albums.page.component.html',
  styleUrl: './albums.page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlbumsPageComponent {
  private readonly albumService = inject(AlbumService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly albums = this.albumService.albums;
  readonly statusOptions = [...ALBUM_STATUSES];
  readonly genreOptions = [...SONG_GENRES];
  editorOpen = false;
  editingId: string | null = null;
  form: Partial<Album> = this.emptyForm();
  @ViewChild('albumNameInput') private albumNameInput?: ElementRef<HTMLInputElement>;

  constructor() {
    void this.albumService.loadAll().then(() => this.openAlbumFromQuery());
  }

  private openAlbumFromQuery(): void {
    const albumId = this.route.snapshot.queryParamMap.get('edit');
    const album = albumId ? this.albums().find((item) => item.id === albumId) : undefined;
    if (album) {
      this.openEdit(album);
    }
  }

  emptyForm(): Partial<Album> {
    return { name: '', artist: '', description: '', genre: 'Hip-Hop', releaseDate: '', status: 'Draft', coverImage: null };
  }

  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.editorOpen = true;
    this.focusEditorInput();
  }

  openEdit(album: Album, event?: Event): void {
    event?.stopPropagation();
    this.editingId = album.id;
    this.form = { ...album };
    this.editorOpen = true;
    this.focusEditorInput();
  }

  private focusEditorInput(): void {
    setTimeout(() => {
      const input = this.albumNameInput?.nativeElement;
      if (!input) {
        return;
      }
      input.scrollIntoView({ behavior: 'smooth', block: 'start' });
      input.focus();
    });
  }

  closeEditor(): void {
    this.editorOpen = false;
  }

  async saveAlbum(): Promise<void> {
    if (!this.form.name?.trim()) {
      return;
    }
    if (this.editingId) {
      await this.albumService.updateAlbum(this.editingId, this.form);
    } else {
      await this.albumService.createAlbum(this.form);
    }
    this.closeEditor();
  }

  async deleteAlbum(album: Album, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (window.confirm(`Delete ${album.name}? Songs will remain in your library.`)) {
      await this.albumService.deleteAlbum(album.id);
    }
  }

  openAlbum(album: Album): void {
    void this.router.navigate(['/albums', album.id]);
  }

  async onCoverSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.form.coverImage = await this.readFile(file);
    input.value = '';
  }

  removeCoverImage(): void {
    this.form.coverImage = null;
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  statusClass(status: AlbumStatus): string {
    return status.toLowerCase().replaceAll(' ', '-');
  }
}
