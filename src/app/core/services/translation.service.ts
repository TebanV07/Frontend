import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ==================== INTERFACES ====================

export interface TranslationJob {
  job_id: number;
  video_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_step: string;
  completed_languages: string[];
  failed_languages: string[];
  error_message?: string;
  estimated_time_minutes: number;
  actual_cost_usd?: number;
  created_at: string;
  completed_at?: string;
}

export interface SubtitleResponse {
  video_id: number;
  language: string;
  subtitle_url: string;
  format: 'srt' | 'vtt' | 'ass';
  is_original: boolean;
  provider: string;
}

export interface AvailableLanguage {
  language: string;
  is_original: boolean;
  subtitle_url?: string;
  audio_url?: string;
  provider: string;
}

export interface TranslationRequest {
  target_languages: string[];
  include_audio: boolean;
  subtitle_format?: 'srt' | 'vtt' | 'ass';
}

export interface TranslationResponse {
  message: string;
  job_id: number;
  video_id: number;
  target_languages: string[];
  estimated_time_minutes: number;
  estimated_cost_usd?: number;
}

export interface ImageTranslationResponse {
  image_id: number;
  extracted_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  processing_time_ms: number;
  cost_usd: number;
  from_cache: boolean;
}

// ==================== SERVICIO ====================

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private apiUrl = 'http://localhost:8001/api/v1';

  constructor(private http: HttpClient) {}

  // ==================== HELPERS ====================

  private getHeaders(): HttpHeaders {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        return new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
      }
    }
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private getHeadersForFormData(): HttpHeaders {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      }
    }
    return new HttpHeaders();
  }

  // ==================== SOLICITAR TRADUCCIÓN ====================

  requestTranslation(
    videoId: number,
    targetLanguages: string[],
    includeAudio: boolean = false,
    subtitleFormat: 'srt' | 'vtt' | 'ass' = 'srt'
  ): Observable<TranslationResponse> {
    const body: TranslationRequest = {
      target_languages: targetLanguages,
      include_audio: includeAudio,
      subtitle_format: subtitleFormat
    };

    return this.http.post<TranslationResponse>(
      `${this.apiUrl}/video_translations/videos/${videoId}/translate`,
      body,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error requesting translation:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== ESTADO DE TRADUCCIÓN ====================

  getTranslationStatus(videoId: number, jobId: number): Observable<TranslationJob> {
    return this.http.get<TranslationJob>(
      `${this.apiUrl}/video_translations/videos/${videoId}/translation-status/${jobId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error getting translation status:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== OBTENER SUBTÍTULOS ====================

  getSubtitles(videoId: number, language: string): Observable<SubtitleResponse> {
    return this.http.get<SubtitleResponse>(
      `${this.apiUrl}/video_translations/videos/${videoId}/subtitles/${language}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error getting subtitles:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== IDIOMAS DISPONIBLES ====================

  getAvailableLanguages(videoId: number): Observable<{
    video_id: number;
    available_languages: AvailableLanguage[];
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

  // ==================== MIS TRABAJOS DE TRADUCCIÓN ====================

  getMyTranslationJobs(limit: number = 10): Observable<{ jobs: TranslationJob[] }> {
    return this.http.get<{ jobs: TranslationJob[] }>(
      `${this.apiUrl}/video_translations/my-translation-jobs`,
      {
        headers: this.getHeaders(),
        params: { limit: limit.toString() }
      }
    ).pipe(
      catchError(error => {
        console.error('Error getting my translation jobs:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== CANCELAR TRADUCCIÓN ====================

  cancelTranslation(videoId: number, jobId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/video_translations/videos/${videoId}/cancel-translation/${jobId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error canceling translation:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== DESCARGAR SUBTÍTULOS ====================

  downloadSubtitles(videoId: number, language: string, format: 'srt' | 'vtt' | 'ass' = 'srt'): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/video_translations/videos/${videoId}/subtitles/${language}/download`,
      {
        headers: this.getHeaders(),
        params: { format },
        responseType: 'blob'
      }
    ).pipe(
      catchError(error => {
        console.error('Error downloading subtitles:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== OCR + TRADUCCIÓN DE IMAGEN ====================

  translateImage(
    imageId: number,
    imageFile: File,
    targetLanguage: string,
    sourceLanguage?: string
  ): Observable<ImageTranslationResponse> {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('target_language', targetLanguage);
    if (sourceLanguage) {
      formData.append('source_language', sourceLanguage);
    }

    return this.http.post<ImageTranslationResponse>(
      `${this.apiUrl}/translations/images/${imageId}`,
      formData,
      { headers: this.getHeadersForFormData() }
    ).pipe(
      catchError(error => {
        console.error('Error translating image:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Descarga la imagen usando HttpClient (respeta token y CORS)
   * y llama al endpoint de traducción.
   */
  async translateImageFromUrl(
    imageId: number,
    imageUrl: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<Observable<ImageTranslationResponse>> {
    const fullUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `http://localhost:8001${imageUrl}`;

    const blob = await this.http.get(fullUrl, {
      headers: this.getHeadersForFormData(),
      responseType: 'blob'
    }).toPromise();

    const fileName = imageUrl.split('/').pop() || 'image.jpg';
    const file = new File([blob!], fileName, { type: blob!.type });

    return this.translateImage(imageId, file, targetLanguage, sourceLanguage);
  }
}
