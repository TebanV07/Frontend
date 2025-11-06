import { Routes } from '@angular/router';
import { LoginComponent } from './shared/components/login/login.component';
import { HomeComponent } from './shared/components/home/home.component';
import { ChatComponent } from './features/chat/components/chat-list/chat.component';
import { VideosComponent } from './features/videos/components/videos/videos.component';
import { LivesComponent } from './features/lives/components/lives/lives.component';
import { ProfileComponent } from './features/profile/components/profile/profile.component';
import { SettingsComponent } from './features/settings/settings.component';
import { TrendingComponent } from './features/trending/components/trending/trending.component';
import { FeedComponent } from './features/feed/components/feed/feed.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'feed', component: FeedComponent }, 
  { path: 'videos', component: VideosComponent },
  { path: 'lives', component: LivesComponent }, 
  { path: 'profile', component: ProfileComponent },
  { path: 'trending', component: TrendingComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '/login' }
];