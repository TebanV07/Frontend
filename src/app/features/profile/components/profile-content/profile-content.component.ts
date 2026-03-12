import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { UserProfile, ProfileService, PostsPage, VideosPage } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-profile-content',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './profile-content.component.html',
  styleUrl: './profile-content.component.scss'
})
export class ProfileContentComponent implements OnChanges {
  @Input() profile!: UserProfile;
  @Input() selectedTab: 'posts' | 'videos' | 'liked' | 'bookmarks' = 'posts';

  posts: any[] = [];
  videos: any[] = [];
  isLoadingPosts = false;
  isLoadingVideos = false;
  hasMorePosts = false;
  hasMoreVideos = false;
  currentPostPage = 1;
  currentVideoPage = 1;

  private loadedForUserId: number | null = null;

  constructor(private profileService: ProfileService) {}

  ngOnChanges(changes: SimpleChanges): void {
    const profileChanged = changes['profile'] && this.profile?.id !== this.loadedForUserId;
    const tabChanged = changes['selectedTab'];

    // Si cambiÃ³ el perfil, resetear todo
    if (profileChanged) {
      this.posts = [];
      this.videos = [];
      this.currentPostPage = 1;
      this.currentVideoPage = 1;
      this.loadedForUserId = this.profile?.id ?? null;
    }

    if (!this.profile?.id) return;

    // Cargar segÃºn el tab activo
    if (this.selectedTab === 'posts' && (profileChanged || tabChanged) && this.posts.length === 0) {
      this.loadPosts();
    }
    if (this.selectedTab === 'videos' && (profileChanged || tabChanged) && this.videos.length === 0) {
      this.loadVideos();
    }
  }

  loadPosts(loadMore = false): void {
    if (this.isLoadingPosts || !this.profile?.id) return;
    if (loadMore) {
      this.currentPostPage++;
    } else {
      this.currentPostPage = 1;
    }

    this.isLoadingPosts = true;
    this.profileService.getUserPosts(this.profile.id, this.currentPostPage).subscribe({
      next: (res: PostsPage) => {
        this.posts = loadMore ? [...this.posts, ...res.posts] : res.posts;
        this.hasMorePosts = res.has_more;
        this.isLoadingPosts = false;
      },
      error: () => { this.isLoadingPosts = false; }
    });
  }

  loadVideos(loadMore = false): void {
    if (this.isLoadingVideos || !this.profile?.id) return;
    if (loadMore) {
      this.currentVideoPage++;
    } else {
      this.currentVideoPage = 1;
    }

    this.isLoadingVideos = true;
    this.profileService.getUserVideos(this.profile.id, this.currentVideoPage).subscribe({
      next: (res: VideosPage) => {
        this.videos = loadMore ? [...this.videos, ...res.videos] : res.videos;
        this.hasMoreVideos = res.has_more;
        this.isLoadingVideos = false;
      },
      error: () => { this.isLoadingVideos = false; }
    });
  }

  formatNumber(num: number): string {
    if (!num) return '0';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8001${url}`;
  }

  getAvatarUrl(avatar: string | null | undefined): string {
    if (!avatar) return 'assets/default-avatar.png';
    if (avatar.startsWith('http')) return avatar;
    return `http://localhost:8001${avatar}`;
  }

  onVideoClick(videoId: number) {
    console.log('Video clicked:', videoId);
    // aquÃ­ puedes navegar: this.router.navigate(['/videos', videoId])
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/default-avatar.png';
  }
}

