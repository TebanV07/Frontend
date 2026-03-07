import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { VideoService, Trending, Video } from '../../../../core/services/video.service';
import { FlagService } from '../../../../core/services/flag.service';

interface TrendingWithVideos extends Trending {
  videos: Video[];
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
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.scss']
})
export class TrendingComponent implements OnInit {
  trendingTopics: TrendingWithVideos[] = [];
  selectedTrending: TrendingWithVideos | null = null;
  selectedView: 'grid' | 'list' = 'grid';
  sortBy: 'trending' | 'views' | 'recent' = 'trending';
  isLoading = true;

  selectedCountry: string | null = null;
  availableCountries: CountryOption[] = [];
  isLoadingCountries = false;

  private apiUrl = 'http://localhost:8001/api/v1';

  constructor(
    private videoService: VideoService,
    private http: HttpClient,
    public flagService: FlagService
  ) {}

  ngOnInit() {
    this.loadAvailableCountries();
    this.loadTrendingTopics();
  }

  // ── Países ────────────────────────────────────────────────────────────────

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

  // ── Trending ──────────────────────────────────────────────────────────────

  loadTrendingTopics() {
    this.isLoading = true;

    this.videoService.getTrending().subscribe({
      next: (trending) => {
        Promise.all(trending.map(t => this.loadVideosForTrending(t))).then(results => {
          this.trendingTopics = results;
          this.isLoading = false;
          if (this.trendingTopics.length > 0) {
            this.selectedTrending = this.trendingTopics[0];
          }
        }).catch(() => { this.isLoading = false; });
      },
      error: () => { this.isLoading = false; }
    });
  }

  private loadVideosForTrending(trending: Trending): Promise<TrendingWithVideos> {
    return new Promise((resolve) => {
      let params = new HttpParams().set('page', '1').set('page_size', '20');
      if (trending.category) params = params.set('category', trending.category);
      if (this.selectedCountry) params = params.set('country_code', this.selectedCountry);

      this.http.get<any>(`${this.apiUrl}/videos/trending/by-country`, { params }).subscribe({
        next: (res) => resolve({ ...trending, videos: res.videos || [] }),
        error: () => {
          // Fallback al endpoint original
          this.videoService.getVideosFeed(1, 10, 'trending', trending.category).subscribe({
            next: (res) => resolve({ ...trending, videos: res.videos }),
            error: () => resolve({ ...trending, videos: [] })
          });
        }
      });
    });
  }

  selectTrending(trending: TrendingWithVideos) {
    this.selectedTrending = trending;
    if (trending.videos.length === 0) {
      let params = new HttpParams().set('page', '1').set('page_size', '20');
      if (trending.category) params = params.set('category', trending.category);
      if (this.selectedCountry) params = params.set('country_code', this.selectedCountry);

      this.http.get<any>(`${this.apiUrl}/videos/trending/by-country`, { params }).subscribe({
        next: (res) => { trending.videos = res.videos || []; },
        error: () => {}
      });
    }
  }

  toggleView(view: 'grid' | 'list') { this.selectedView = view; }

  setSortBy(sort: 'trending' | 'views' | 'recent') {
    this.sortBy = sort;
    if (this.selectedTrending) this.sortVideos(this.selectedTrending.videos);
  }

  private sortVideos(videos: Video[]) {
    switch (this.sortBy) {
      case 'views':
        videos.sort((a, b) => b.views_count - a.views_count);
        break;
      case 'recent':
        videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
  }

  // ── Helpers template ──────────────────────────────────────────────────────

  formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(num || 0);
  }

  getTrendingPosition(index: number): string { return `#${index + 1}`; }

  getVideoTitle(video: Video): string { return video.title || 'Sin título'; }
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

  getUserAvatar(video: Video): string { return video.user?.avatar || 'assets/default-avatar.png'; }
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
