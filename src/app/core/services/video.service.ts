import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserBasic } from '../models/user.model';

// ==================== INTERFACES ====================

// reutilizamos UserBasic para representar al autor del video

export interface Video {
  id: number;
  uuid: string;
  user_id: number;
  user?: UserBasic;
  title?: string;
  description?: string;
  video_url: string;
  orientation?: 'vertical' | 'horizontal' | 'square';
  raw_video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  original_language: string;
  available_languages?: string[];
  processing_status: string;
  is_public: boolean;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;

  // Datos enriquecidos del usuario actual
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface VideoUploadResponse {
  id: number;
  uuid: string;
  message: string;
  processing_status: string;
  video_url: string;
  thumbnail_url?: string;
}

export interface VideoListResponse {
  videos: Video[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface VideoTranslationJob {
  job_id: number;
  video_id: number;
  status: string;
  progress: number;
  current_step: string;
  completed_languages: string[];
  failed_languages: string[];
  error_message?: string;
  actual_cost_usd?: number;
  created_at: string;
  completed_at?: string;
}

export interface VideoSubtitle {
  video_id: number;
  language: string;
  subtitle_url: string;
  is_ai_generated: boolean;
  created_at?: string;
}
export interface DubbedVideoResponse {
  video_id: number;
  language: string;
  translated_video_url: string;
  audio_url: string;
  voice_type: string;
  created_at: string;
}

// Nueva interfaz para Trending (simplificada)
export interface Trending {
  id: string;
  hashtag: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  videosCount: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  trendScore: number;
}

interface TrendingApiResponse {
  country_code?: string | null;
  generated_at: string;
  trends: Array<{
    id: string;
    hashtag: string;
    title: string;
    category?: string | null;
    thumbnail_url?: string | null;
    videos_count: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    trend_score: number;
  }>;
}

// ==================== SERVICIO ====================

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'https://web-production-94f95.up.railway.app/api/v1';
  private currentVideo$ = new BehaviorSubject<Video | null>(null);

  constructor(private http: HttpClient) {}

  // ==================== HELPERS ====================

  private getHeaders(): HttpHeaders {
  // Verificar si estamos en el navegador
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
  }

  // Si no hay token o estamos en SSR, retornar headers básicos
  return new HttpHeaders();
}

  // ✅ DESPUÉS
private getHeadersWithoutContentType(): HttpHeaders {
  // Verificar si estamos en el navegador
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
  }

  // Si no hay token, retornar headers vacíos
  return new HttpHeaders();
}

  // ==================== UPLOAD VIDEO ====================

  uploadVideo(
    videoFile: File,
    title?: string,
    description?: string,
    originalLanguage: string = 'es',
    category?: string,
    tags?: string[],
    isPublic: boolean = true
  ): Observable<{progress: number, response?: VideoUploadResponse}> {

    const formData = new FormData();
    formData.append('video_file', videoFile, videoFile.name);

    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('original_language', originalLanguage);
    if (category) formData.append('category', category);
    if (tags && tags.length > 0) formData.append('tags', JSON.stringify(tags));
    formData.append('is_public', String(isPublic));

    return this.http.post<VideoUploadResponse>(
      `${this.apiUrl}/videos/`,
      formData,
      {
        headers: this.getHeadersWithoutContentType(),
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total
            ? Math.round(100 * event.loaded / event.total)
            : 0;
          return { progress };
        } else if (event.type === HttpEventType.Response) {
          return { progress: 100, response: event.body as VideoUploadResponse };
        }
        return { progress: 0 };
      }),
      catchError(error => {
        console.error('Error uploading video:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== GET VIDEO BY ID ====================

  getVideo(videoId: number): Observable<Video> {
    return this.http.get<Video>(
      `${this.apiUrl}/videos/${videoId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error getting video:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== GET VIDEO BY UUID ====================

  getVideoByUuid(uuid: string): Observable<Video> {
    return this.http.get<Video>(
      `${this.apiUrl}/videos/uuid/${uuid}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error getting video by UUID:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== GET VIDEOS FEED ====================

  getVideosFeed(
    page: number = 1,
    pageSize: number = 20,
    feedType: 'for_you' | 'following' | 'trending' = 'for_you',
    category?: string,
    userId?: number
  ): Observable<VideoListResponse> {

    let params: any = {
      page: page.toString(),
      page_size: pageSize.toString(),
      feed_type: feedType
    };

    if (category) params['category'] = category;
    if (userId) params['user_id'] = userId.toString();

    return this.http.get<VideoListResponse>(
      `${this.apiUrl}/videos/`,
      {
        headers: this.getHeaders(),
        params
      }
    ).pipe(
      catchError(error => {
        console.error('Error getting videos feed:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== NUEVO: GET VIDEOS (simplificado para componentes) ====================

  getVideos(page: number = 1, pageSize: number = 20): Observable<Video[]> {
    return this.getVideosFeed(page, pageSize, 'for_you').pipe(
      map(response => response.videos),
      catchError(error => {
        console.error('Error getting videos:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== NUEVO: GET TRENDING ====================

  getTrending(countryCode?: string, limit: number = 12): Observable<Trending[]> {
    let params = new HttpParams().set('limit', limit.toString());

    if (countryCode) {
      params = params.set('country_code', countryCode);
    }

    return this.http.get<TrendingApiResponse>(
      `${this.apiUrl}/videos/trending/hashtags`,
      {
        headers: this.getHeaders(),
        params
      }
    ).pipe(
      map(response => response.trends.map(trend => ({
        id: trend.id,
        hashtag: trend.hashtag,
        title: trend.title || `#${trend.hashtag}`,
        category: trend.category || 'General',
        thumbnailUrl: trend.thumbnail_url || 'assets/default-thumb.png',
        videosCount: trend.videos_count || 0,
        views: trend.views || 0,
        likes: trend.likes || 0,
        comments: trend.comments || 0,
        shares: trend.shares || 0,
        trendScore: trend.trend_score || 0,
      }))),
      catchError(error => {
        console.error('Error getting trending:', error);
        return throwError(() => error);
      })
    );
  }

  getTrendingVideosByCountry(options: {
    countryCode?: string | null;
    category?: string;
    hashtag?: string;
    page?: number;
    pageSize?: number;
  }): Observable<VideoListResponse> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('page_size', String(options.pageSize ?? 20));

    if (options.countryCode) {
      params = params.set('country_code', options.countryCode);
    }

    if (options.category) {
      params = params.set('category', options.category);
    }

    if (options.hashtag) {
      params = params.set('hashtag', options.hashtag);
    }

    return this.http.get<VideoListResponse>(
      `${this.apiUrl}/videos/trending/by-country`,
      {
        headers: this.getHeaders(),
        params
      }
    ).pipe(
      catchError(error => {
        console.error('Error getting trending videos by country:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== UPDATE VIDEO ====================

  updateVideo(
    videoId: number,
    updates: {
      title?: string;
      description?: string;
      is_public?: boolean;
      category?: string;
      tags?: string[];
    }
  ): Observable<Video> {
    return this.http.put<Video>(
      `${this.apiUrl}/videos/${videoId}`,
      updates,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error updating video:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== DELETE VIDEO ====================

  deleteVideo(videoId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/videos/${videoId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error deleting video:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== LIKE VIDEO ====================

  toggleLike(videoId: number): Observable<{message: string, is_liked: boolean, likes_count: number}> {
    return this.http.post<any>(
      `${this.apiUrl}/videos/${videoId}/like`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error toggling like:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== SAVE VIDEO (BOOKMARK) ====================

  toggleSave(videoId: number): Observable<{message: string, is_saved: boolean, saves_count: number}> {
    return this.http.post<any>(
      `${this.apiUrl}/videos/${videoId}/save`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error toggling save:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== NUEVO: ALIAS para toggleBookmark ====================

  toggleBookmark(videoId: number): Observable<{message: string, is_saved: boolean, saves_count: number}> {
    return this.toggleSave(videoId);
  }

  // ==================== SHARE VIDEO ====================

  shareVideo(videoId: number): Observable<{message: string, shares_count: number}> {
    return this.http.post<any>(
      `${this.apiUrl}/videos/${videoId}/share`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error sharing video:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== TRADUCCIÓN DE VIDEOS ====================

requestVideoTranslation(
  videoId: number,
  targetLanguages: string[],
  includeAudio: boolean = false,
  subtitleFormat: 'srt' | 'vtt' | 'ass' = 'srt',
  ttsProvider: 'openai' | 'elevenlabs' = 'openai',  // ✅ NUEVO
  cloneVoice: boolean = false,  // ✅ NUEVO
  useSyncedTTS: boolean = true  // ✅ NUEVO
): Observable<{
  message: string;
  job_id: number;
  video_id: number;
  target_languages: string[];
  estimated_time_minutes: number;
}> {
  const body = {
    target_languages: targetLanguages,
    include_audio: includeAudio,
    subtitle_format: subtitleFormat,
    tts_provider: ttsProvider,  // ✅ NUEVO
    clone_voice: cloneVoice,    // ✅ NUEVO
    use_synced_tts: useSyncedTTS  // ✅ NUEVO
  };

  console.log('📤 Request body:', JSON.stringify(body, null, 2));
  console.log('🎙️ TTS Provider:', ttsProvider);
  console.log('🎤 Clone Voice:', cloneVoice);

  return this.http.post<any>(
    `${this.apiUrl}/video_translations/videos/${videoId}/translate`,
    body,
    { headers: this.getHeaders() }
  ).pipe(
    catchError(error => {
      console.error('❌ Error requesting translation:', error);
      return throwError(() => error);
    })
  );
}

  // ==================== ESTADO DE TRADUCCIÓN ====================

  getTranslationStatus(videoId: number, jobId: number): Observable<VideoTranslationJob> {
    return this.http.get<VideoTranslationJob>(
      `${this.apiUrl}/video_translations/videos/${videoId}/translation-status/${jobId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error getting translation status:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== GET SUBTITLES ====================

getSubtitles(videoId: number, language: string): Observable<VideoSubtitle> {
  return this.http.get<VideoSubtitle>(
    `${this.apiUrl}/video_translations/videos/${videoId}/subtitles/${language}`,
    { headers: this.getHeaders() }
  ).pipe(
    catchError(error => {
      console.error('Error getting subtitles:', error);
      return throwError(() => error);
    })
  );
}
  // ==================== GET AVAILABLE LANGUAGES ====================

  getAvailableLanguages(videoId: number): Observable<{
    video_id: number;
    available_languages: VideoSubtitle[];
  }> {
    return this.http.get<any>(
      `${this.apiUrl}/video_translations/videos/${videoId}/available-languages`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error getting available languages:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== GET MY TRANSLATION JOBS ====================

  getMyTranslationJobs(limit: number = 10): Observable<{jobs: VideoTranslationJob[]}> {
    return this.http.get<any>(
      `${this.apiUrl}/video_translations/my-translation-jobs`,
      {
        headers: this.getHeaders(),
        params: { limit: limit.toString() }
      }
    ).pipe(
      catchError(error => {
        console.error('Error getting my jobs:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== CURRENT VIDEO (STATE) ====================

  getCurrentVideo(): Observable<Video | null> {
    return this.currentVideo$.asObservable();
  }

  setCurrentVideo(video: Video | null): void {
    this.currentVideo$.next(video);
  }

  clearCurrentVideo(): void {
    this.currentVideo$.next(null);
  }
  getDubbedVideo(
  videoId: number,
  language: string
): Observable<DubbedVideoResponse> {
  return this.http.get<DubbedVideoResponse>(
    `${this.apiUrl}/video_translations/videos/${videoId}/dubbed/${language}`,
    { headers: this.getHeaders() }
  ).pipe(
    catchError(error => {
      console.error('🎙️ Error obteniendo video doblado:', error);
      return throwError(() => error);
    })
  );
}
}

