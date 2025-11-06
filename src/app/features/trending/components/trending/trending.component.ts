import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoService, Trending, Video } from '../../../../core/services/video.service';

interface TrendingWithVideos extends Trending {
  videos: Video[];
}

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trending.component.html',
  styleUrl: './trending.component.scss'
})
export class TrendingComponent implements OnInit {
  trendingTopics: TrendingWithVideos[] = [];
  selectedTrending: TrendingWithVideos | null = null;
  selectedView: 'grid' | 'list' = 'grid';
  filterCategory = 'all';
  sortBy: 'trending' | 'views' | 'recent' = 'trending';

  categories = ['all', 'Technology', 'Food', 'Fitness', 'Travel', 'Music', 'Education'];

  constructor(private videoService: VideoService) {}

  ngOnInit() {
    this.loadTrendingTopics();
  }

  loadTrendingTopics() {
    this.videoService.getTrending().subscribe(trending => {
      // Simular videos para cada tendencia
      this.trendingTopics = trending.map(t => ({
        ...t,
        videos: this.getVideosForTrending(t.id)
      }));

      if (this.trendingTopics.length > 0) {
        this.selectedTrending = this.trendingTopics[0];
      }
    });
  }

  getVideosForTrending(trendingId: string): Video[] {
    // Simular videos relacionados con la tendencia
    return [
      {
        id: `vid-${trendingId}-1`,
        user: {
          id: '1',
          username: '@creator1',
          name: 'Creator 1',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          verified: true,
          followers: 50000,
          following: 100,
          language: 'English',
          country: 'USA'
        },
        title: `Amazing ${trendingId} content`,
        description: 'This is trending content related to the topic',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=500&fit=crop',
        duration: 45,
        views: 245000,
        likes: 12500,
        comments: 856,
        shares: 1200,
        originalLanguage: 'English',
        hasAudioTranslation: true,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(),
        category: 'Technology',
        tags: ['trending', 'viral']
      }
    ];
  }

  selectTrending(trending: TrendingWithVideos) {
    this.selectedTrending = trending;
  }

  toggleView(view: 'grid' | 'list') {
    this.selectedView = view;
  }

  setFilter(category: string) {
    this.filterCategory = category;
  }

  setSortBy(sort: 'trending' | 'views' | 'recent') {
    this.sortBy = sort;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getCategories(): string[] {
    const allCategories = new Set(this.trendingTopics.map(t => t.category));
    return Array.from(allCategories);
  }

  getTrendingPosition(index: number): string {
    return `#${index + 1}`;
  }
}