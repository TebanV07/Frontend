import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

interface QuickAccessItem {
  icon: string;
  labelKey: string;
  route?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  profileStats = {
    followers_count: 0,
    following_count: 0,
    posts_count: 0
  };

  readonly defaultAvatar = 'assets/default-avatar.png';
  private apiUrl = 'http://localhost:8001/api/v1';
  private destroy$ = new Subject<void>();

  quickAccessItems: QuickAccessItem[] = [
    { icon: 'trending', labelKey: 'header.nav.trending', route: '/trending' },
    { icon: 'videos',   labelKey: 'header.nav.videos', route: '/videos' },
    { icon: 'chat',     labelKey: 'header.nav.messages', route: '/chat' },
    { icon: 'profile',  labelKey: 'header.nav.profile', route: '/profile' },
    { icon: 'settings', labelKey: 'header.nav.settings', route: '/settings' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user?.id) {
          this.loadUserStats();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // âœ… CORREGIDO: incluye el token en el header
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  loadUserStats() {
    this.http
      .get<any>(`${this.apiUrl}/users/me`, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userData) => {
          // âœ… El schema usa serialization_alias, por eso el JSON devuelve:
          //    followers_count â†’ "followers"
          //    following_count â†’ "following"
          //    posts_count     â†’ "postsCount"
          // Soportamos ambas variantes por si cambia la configuraciÃ³n
          this.profileStats.followers_count = userData.followers      ?? userData.followers_count ?? 0;
          this.profileStats.following_count = userData.following      ?? userData.following_count ?? 0;
          this.profileStats.posts_count     = userData.postsCount     ?? userData.posts_count     ?? 0;

          // Actualizar el currentUser con los datos frescos del backend
          this.currentUser = {
            ...this.currentUser,
            ...(userData.avatar     && { avatar:      userData.avatar }),
            ...(userData.firstName  && { first_name:  userData.firstName }),
            ...(userData.lastName   && { last_name:   userData.lastName }),
            ...(userData.username   && { username:    userData.username }),
            followers_count: userData.followers   ?? userData.followers_count ?? 0,
            following_count: userData.following   ?? userData.following_count ?? 0,
            posts_count:     userData.postsCount  ?? userData.posts_count     ?? 0,
          };
        },
        error: () => {
          // Fallback a lo que hay en localStorage
          this.profileStats.followers_count = this.currentUser?.followers_count ?? this.currentUser?.followers ?? 0;
          this.profileStats.following_count = this.currentUser?.following_count ?? this.currentUser?.following ?? 0;
          this.profileStats.posts_count     = this.currentUser?.posts_count     ?? this.currentUser?.postsCount ?? 0;
        }
      });
  }

  getAvatarUrl(): string {
    const avatar = this.currentUser?.avatar || this.currentUser?.profile_image;
    if (!avatar) return this.defaultAvatar;
    if (avatar.startsWith('http')) return avatar;
    return `http://localhost:8001${avatar}`;
  }

  onAvatarError(event: Event) {
    (event.target as HTMLImageElement).src = this.defaultAvatar;
  }

  formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000)     return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  }

  navigateTo(route?: string) {
    if (route) this.router.navigate([route]);
  }

  getIconPath(iconType: string): string {
    const icons: { [key: string]: string } = {
      trending: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      videos:   'M23 7l-7 5 7 5V7zM1 5v14a2 2 0 002 2h15a2 2 0 002-2V5a2 2 0 00-2-2H3a2 2 0 00-2 2z',
      live:     'M12 2a10 10 0 100 20 10 10 0 000-20zm0 15a5 5 0 110-10 5 5 0 010 10z',
      chat:     'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
      profile:  'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
      settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z'
    };
    return icons[iconType] || '';
  }
}

