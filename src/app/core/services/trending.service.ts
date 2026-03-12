import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, combineLatest } from 'rxjs';
import { tap, switchMap, startWith, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface TrendingPost {
  id: number;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
  created_at: string;
  trend_score?: number;
}

export interface TrendingVideo {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
  created_at: string;
  trend_score?: number;
}

export interface TrendingHashtag {
  id: number;
  name: string;
  usage_count: number;
  trend_score?: number;
}

export interface TrendingStats {
  topPosts: TrendingPost[];
  topVideos: TrendingVideo[];
  topHashtags: TrendingHashtag[];
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TrendingService {
  private apiUrl = 'http://localhost:8001/api/v1';

  private trendingPostsSubject = new BehaviorSubject<TrendingPost[]>([]);
  public trendingPosts$ = this.trendingPostsSubject.asObservable();

  private trendingVideosSubject = new BehaviorSubject<TrendingVideo[]>([]);
  public trendingVideos$ = this.trendingVideosSubject.asObservable();

  private allTrendingSubject = new BehaviorSubject<TrendingStats | null>(null);
  public allTrending$ = this.allTrendingSubject.asObservable();

  private refreshIntervalMs = 60000; // Refrescar cada minuto

  constructor(private http: HttpClient) {
    this.startAutoRefresh();
  }

  // ============== POSTS ==============

  /**
   * Obtener posts en tendencia
   * GET /api/v1/posts?order_by=trending&limit={limit}
   */
  getTrendingPosts(limit: number = 10): Observable<TrendingPost[]> {
    let params = new HttpParams()
      .set('order_by', 'trending')
      .set('limit', limit.toString());

    return this.http.get<TrendingPost[]>(`${this.apiUrl}/posts`, { params })
      .pipe(
        tap(posts => {
          this.trendingPostsSubject.next(posts);
        })
      );
  }

  /**
   * Obtener posts populares
   * GET /api/v1/posts?order_by=popular&limit={limit}
   */
  getPopularPosts(limit: number = 10): Observable<TrendingPost[]> {
    let params = new HttpParams()
      .set('order_by', 'popular')
      .set('limit', limit.toString());

    return this.http.get<TrendingPost[]>(`${this.apiUrl}/posts`, { params });
  }

  /**
   * Obtener posts recientes
   * GET /api/v1/posts?order_by=recent&limit={limit}
   */
  getRecentPosts(limit: number = 10): Observable<TrendingPost[]> {
    let params = new HttpParams()
      .set('order_by', 'recent')
      .set('limit', limit.toString());

    return this.http.get<TrendingPost[]>(`${this.apiUrl}/posts`, { params });
  }

  // ============== VIDEOS ==============

  /**
   * Obtener videos en tendencia
   * GET /api/v1/videos?order_by=trending&limit={limit}
   */
  getTrendingVideos(limit: number = 10): Observable<TrendingVideo[]> {
    let params = new HttpParams()
      .set('order_by', 'trending')
      .set('limit', limit.toString());

    return this.http.get<TrendingVideo[]>(`${this.apiUrl}/videos`, { params })
      .pipe(
        tap(videos => {
          this.trendingVideosSubject.next(videos);
        })
      );
  }

  /**
   * Obtener videos populares
   * GET /api/v1/videos?order_by=popular&limit={limit}
   */
  getPopularVideos(limit: number = 10): Observable<TrendingVideo[]> {
    let params = new HttpParams()
      .set('order_by', 'popular')
      .set('limit', limit.toString());

    return this.http.get<TrendingVideo[]>(`${this.apiUrl}/videos`, { params });
  }

  /**
   * Obtener videos recientes
   * GET /api/v1/videos?order_by=recent&limit={limit}
   */
  getRecentVideos(limit: number = 10): Observable<TrendingVideo[]> {
    let params = new HttpParams()
      .set('order_by', 'recent')
      .set('limit', limit.toString());

    return this.http.get<TrendingVideo[]>(`${this.apiUrl}/videos`, { params });
  }

  // ============== COMBINADO ==============

  /**
   * Obtener trending (posts + videos)
   */
  getAllTrending(): Observable<TrendingStats> {
    // Obtener ambos en paralelo
    return combineLatest([
      this.getTrendingPosts(5),
      this.getTrendingVideos(5)
    ]).pipe(
      map(([posts, videos]) => ({
        topPosts: posts,
        topVideos: videos,
        topHashtags: [],
        lastUpdated: new Date()
      })),
      tap(stats => {
        this.allTrendingSubject.next(stats);
      })
    );
  }

  /**
   * Refrescar manualmente las tendencias
   */
  refreshTrending(): void {
    this.getAllTrending().subscribe();
  }

  /**
   * Autorefresh cada cierto tiempo
   */
  private startAutoRefresh(): void {
    interval(this.refreshIntervalMs)
      .pipe(
        startWith(0),
        switchMap(() => this.getAllTrending()),
        catchError(() => of(null))
      )
      .subscribe();
  }

  /**
   * Cambiar intervalo de refresco
   */
  setRefreshInterval(intervalMs: number): void {
    this.refreshIntervalMs = intervalMs;
  }
}
