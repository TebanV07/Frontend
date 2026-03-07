import { Routes } from '@angular/router';
import { LoginComponent } from './shared/components/login/login.component';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
import { HomeComponent } from './shared/components/home/home.component';
import { ChatComponent } from './features/chat/components/chat-list/chat.component';
import { LivesComponent } from './features/lives/components/lives/lives.component';
import { ProfileComponent } from './features/profile/components/profile/profile.component';
import { SettingsComponent } from './features/settings/settings.component';
import { TrendingComponent } from './features/trending/components/trending/trending.component';
import { FeedComponent } from './features/feed/components/feed/feed.component';
import { ExplorePeopleComponent } from './features/users/components/explore-people/explore-people.component';
import { TermsComponent } from './shared/components/terms/terms.component';
import { PermissionsComponent } from './shared/components/permissions/permissions.component';
import { TermsGuard } from './core/guards/terms.guard';
import { PermissionsGuard } from './core/guards/permissions.guard';
import { authGuard } from './core/guards/auth.guard';
import { UploadComponent } from './features/upload/upload.component';
import { VideoFeedComponent } from './features/videos/components/video-feed/video-feed.component';
import { EditPostComponent } from './features/posts/components/edit-post/edit-post.component';
import { PostDetailComponent } from './features/posts/components/post-detail/post-detail.component';
import { NotificationsPageComponent } from './features/settings/notifications-page/notifications-page.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'permissions', component: PermissionsComponent },

  // Verificación de email — página pública sin layout
  {
    path: 'verify-email/:token',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component')
        .then(m => m.VerifyEmailComponent)
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [TermsGuard, PermissionsGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'chat', component: ChatComponent },
      { path: 'feed', component: FeedComponent },
      { path: 'videos', component: VideoFeedComponent },
      { path: 'lives', component: LivesComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'profile/:username', component: ProfileComponent },
      { path: 'explore/people', component: ExplorePeopleComponent },
      { path: 'trending', component: TrendingComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'upload', component: UploadComponent },
      { path: 'videos/:id', component: VideoFeedComponent },
      { path: 'posts/:id/edit', component: EditPostComponent, canActivate: [authGuard] },
      { path: 'posts/:id', component: PostDetailComponent },
      { path: 'notifications', component: NotificationsPageComponent },
    ]
  },

  { path: '**', redirectTo: '/login' }
];
