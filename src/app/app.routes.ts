import { Routes } from '@angular/router';
import { ArchivePageComponent } from './pages/archive/archive.component';
import { AlbumDetailsComponent } from './pages/album-details/album-details.component';
import { AlbumsPageComponent } from './pages/albums/albums.page.component';
import { BpmLabComponent } from './pages/bpm-lab/bpm-lab.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RhymeLabComponent } from './pages/rhyme-lab/rhyme-lab.component';
import { SettingsPageComponent } from './pages/settings/settings.component';
import { SongWorkspaceComponent } from './pages/song-workspace/song-workspace.component';
import { SongsPageComponent } from './pages/songs/songs.page.component';
import { TagsPageComponent } from './pages/tags/tags.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'songs', component: SongsPageComponent },
  { path: 'songs/:id', component: SongWorkspaceComponent },
  { path: 'albums', component: AlbumsPageComponent },
  { path: 'albums/:id', component: AlbumDetailsComponent },
  { path: 'rhyme-lab', component: RhymeLabComponent },
  { path: 'bpm-lab', component: BpmLabComponent },
  { path: 'tags', component: TagsPageComponent },
  { path: 'archive', component: ArchivePageComponent },
  { path: 'settings', component: SettingsPageComponent },
  { path: '**', redirectTo: 'dashboard' }
];
