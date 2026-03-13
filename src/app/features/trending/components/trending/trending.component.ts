import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { VideoService, Trending, Video } from '../../../../core/services/video.service';
import { FlagService } from '../../../../core/services/flag.service';

interface TrendingWithVideos extends Trending {
  videos: Video[];
  isLoadingVideos: boolean;
}

interface CountryOption {
  country_code: string;
  video_count: number;
  flag_url: string;
  name: string;
}

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.scss']
})
export class TrendingComponent implements OnInit {
  trendingTopics: TrendingWithVideos[] = [];
  selectedTrending: TrendingWithVideos | null = null;
  fallbackVideos: Video[] = [];
  fallbackVideosTotal = 0;
  isLoadingFallbackVideos = false;
  selectedView: 'grid' | 'list' = 'grid';
  sortBy: 'trending' | 'views' | 'recent' = 'trending';
  isLoading = true;

  selectedCountry: string | null = null;
  availableCountries: CountryOption[] = [];
  isLoadingCountries = false;

  private apiUrl = 'https://web-production-94f95.up.railway.app/api/v1';
  private baseUrl = 'https://web-production-94f95.up.railway.app';

  constructor(
    private videoService: VideoService,
    private http: HttpClient,
    public flagService: FlagService
  ) {}

  ngOnInit() {
    this.loadAvailableCountries();
    this.loadTrendingTopics();
  }

  // Paises

  loadAvailableCountries() {
    this.isLoadingCountries = true;
    this.http.get<{ country_code: string; video_count: number }[]>(
      `${this.apiUrl}/videos/trending/countries`
    ).subscribe({
      next: (data) => {
        this.availableCountries = data.map(c => ({
          country_code: c.country_code,
          video_count: c.video_count,
          flag_url: this.flagService.getCountryFlagUrl(c.country_code, 20),
          name: this.flagService.getCountryName(c.country_code),
        }));
        this.isLoadingCountries = false;
      },
      error: () => { this.isLoadingCountries = false; }
    });
  }

  selectCountry(code: string | null) {
    this.selectedCountry = code;
    this.loadTrendingTopics();
  }

  getSelectedCountryName(): string {
    if (!this.selectedCountry) return '';
    return this.flagService.getCountryName(this.selectedCountry);
  }

  // Trending

  loadTrendingTopics() {
    this.isLoading = true;
    this.selectedTrending = null;
    this.fallbackVideos = [];
    this.fallbackVideosTotal = 0;
    this.isLoadingFallbackVideos = false;

    this.videoService.getTrending(this.selectedCountry || undefined).subscribe({
      next: (trending) => {
        this.trendingTopics = trending.map(topic => ({
          ...topic,
          videos: [],
          isLoadingVideos: false,
        }));
        this.isLoading = false;

        if (this.trendingTopics.length > 0) {
          this.selectTrending(this.trendingTopics[0]);
        } else {
          this.loadFallbackVideos();
        }
      },
      error: () => {
        this.trendingTopics = [];
        this.selectedTrending = null;
        this.isLoading = false;
        this.loadFallbackVideos();
      }
    });
  }

  private loadFallbackVideos(): void {
    this.isLoadingFallbackVideos = true;

    this.videoService.getTrendingVideosByCountry({
      page: 1,
      pageSize: 20,
      countryCode: this.selectedCountry,
    }).subscribe({
      next: (response) => {
        this.fallbackVideos = response.videos || [];
        this.fallbackVideosTotal = response.total || this.fallbackVideos.length;
        this.sortVideos(this.fallbackVideos);
        this.isLoadingFallbackVideos = false;
      },
      error: () => {
        this.fallbackVideos = [];
        this.fallbackVideosTotal = 0;
        this.isLoadingFallbackVideos = false;
      }
    });
  }

  private loadVideosForTrending(trending: TrendingWithVideos): void {
    trending.isLoadingVideos = true;

    this.videoService.getTrendingVideosByCountry({
      page: 1,
      pageSize: 20,
      countryCode: this.selectedCountry,
      hashtag: trending.hashtag,
      category: trending.hashtag ? undefined : trending.category,
    }).subscribe({
      next: (response) => {
        trending.videos = response.videos || [];
        this.sortVideos(trending.videos);
        trending.isLoadingVideos = false;
      },
      error: () => {
        trending.videos = [];
        trending.isLoadingVideos = false;
      }
    });
  }

  selectTrending(trending: TrendingWithVideos) {
    this.selectedTrending = trending;
    if (!trending.isLoadingVideos && trending.videos.length === 0) {
      this.loadVideosForTrending(trending);
    }
  }

  toggleView(view: 'grid' | 'list') { this.selectedView = view; }

  setSortBy(sort: 'trending' | 'views' | 'recent') {
    this.sortBy = sort;
    if (this.selectedTrending) {
      this.sortVideos(this.selectedTrending.videos);
      return;
    }

    this.sortVideos(this.fallbackVideos);
  }

  private sortVideos(videos: Video[]) {
    switch (this.sortBy) {
      case 'trending':
        videos.sort((a, b) => {
          const scoreA = (a.likes_count * 4) + (a.comments_count * 3) + (a.shares_count * 5) + (a.views_count * 0.15);
          const scoreB = (b.likes_count * 4) + (b.comments_count * 3) + (b.shares_count * 5) + (b.views_count * 0.15);
          return scoreB - scoreA;
        });
        break;
      case 'views':
        videos.sort((a, b) => b.views_count - a.views_count);
        break;
      case 'recent':
        videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
  }

  // Helpers template

  formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(num || 0);
  }

  getTrendingPosition(index: number): string { return `#${index + 1}`; }
  get displayedVideos(): Video[] { return this.selectedTrending?.videos ?? this.fallbackVideos; }
  get isLoadingDisplayedVideos(): boolean {
    return this.selectedTrending?.isLoadingVideos ?? this.isLoadingFallbackVideos;
  }
  get hasDisplayedVideosSection(): boolean {
    return !!this.selectedTrending || this.isLoadingFallbackVideos || this.fallbackVideos.length > 0;
  }
  get displayedVideosCount(): number {
    return this.selectedTrending?.videosCount ?? this.fallbackVideosTotal;
  }

  getVideoTitle(video: Video): string { return video.title || 'Sin titulo'; }
  getVideoDescription(video: Video): string { return video.description || ''; }
  getVideoDuration(video: Video): number { return video.duration || 0; }
  getVideoViews(video: Video): number { return video.views_count || 0; }
  getVideoLikes(video: Video): number { return video.likes_count || 0; }
  getVideoComments(video: Video): number { return video.comments_count || 0; }
  getVideoThumbnail(video: Video): string { return video.thumbnail_url || 'assets/default-thumb.png'; }
  getVideoTags(video: Video): string[] { return video.tags || []; }

  getUserName(video: Video): string {
    const full = ((video.user?.first_name || '') + ' ' + (video.user?.last_name || '')).trim();
    return full || video.user?.username || 'Usuario';
  }

  getUserAvatar(video: Video): string {
    const user = video.user as any;
    const avatar = user?.avatar || user?.avatar_url || user?.profile_picture_url || user?.profile_image;

    if (!avatar) {
      return 'assets/default-avatar.png';
    }

    if (typeof avatar !== 'string') {
      return 'assets/default-avatar.png';
    }

    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
      return avatar;
    }

    const normalizedPath = avatar.startsWith('/') ? avatar : `/${avatar}`;
    return `${this.baseUrl}${normalizedPath}`;
  }
  isUserVerified(video: Video): boolean { return video.user?.is_verified || false; }

  getUserCountryCode(video: Video): string {
    return (video.user as any)?.country_code || '';
  }

  getUserFlagUrl(video: Video): string {
    return this.flagService.getCountryFlagUrl(this.getUserCountryCode(video), 20);
  }

  getUserCountryName(video: Video): string {
    return this.flagService.getCountryName(this.getUserCountryCode(video));
  }
}


