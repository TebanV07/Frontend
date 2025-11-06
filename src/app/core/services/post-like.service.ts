import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  LikeToggleResponse, 
  LikeCountResponse, 
  LikeCheckResponse,
  LikeUser 
} from '../models/like.model';

@Injectable({
  providedIn: 'root'
})
export class PostLikeService {
  private apiUrl = '/api/v1/likes';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // ✅ AGREGA ESTE MÉTODO
  private getAuthHeaders(): HttpHeaders {
    let token = '';
    if (this.isBrowser) {
      token = localStorage.getItem('access_token') || '';
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  toggleLike(postId: number, isLiked: boolean): Observable<any> {
    if (isLiked) {
      return this.http.delete(`${this.apiUrl}/posts/${postId}/unlike`, {
        headers: this.getAuthHeaders() // ✅ AGREGA HEADERS
      });
    } else {
      return this.http.post(`${this.apiUrl}/posts/${postId}/like`, {}, {
        headers: this.getAuthHeaders() // ✅ AGREGA HEADERS
      });
    }
  }

  getLikesCount(postId: number): Observable<LikeCountResponse> {
    return this.http.get<LikeCountResponse>(`${this.apiUrl}/posts/${postId}/count`, {
      headers: this.getAuthHeaders() // ✅ AGREGA HEADERS
    });
  }

  checkIfLiked(postId: number): Observable<LikeCheckResponse> {
    return this.http.get<LikeCheckResponse>(`${this.apiUrl}/posts/${postId}/check`, {
      headers: this.getAuthHeaders() // ✅ AGREGA HEADERS
    });
  }

  getLikers(postId: number, page: number = 1, limit: number = 20): Observable<LikeUser[]> {
    const params = new HttpParams()
      .set('skip', ((page - 1) * limit).toString())
      .set('limit', limit.toString());
    
    return this.http.get<LikeUser[]>(`${this.apiUrl}/posts/${postId}/users`, { 
      params,
      headers: this.getAuthHeaders() // ✅ AGREGA HEADERS
    });
  }
}