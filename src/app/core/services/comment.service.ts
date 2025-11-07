// comment.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, CreateCommentDto } from '../models/comment.model';

const API_BASE = 'http://localhost:8001/api/v1';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

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

  // Obtener comentarios de un post
  getComments(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(
      `${API_BASE}/comments/posts/${postId}/comments`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Crear comentario en un post
  createComment(postId: number, commentData: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(
      `${API_BASE}/comments/posts/${postId}/comments`,
      commentData,
      { headers: this.getAuthHeaders() }
    );
  }

  // Dar like a un comentario
  likeComment(commentId: number): Observable<any> {
    return this.http.post(
      `${API_BASE}/likes/comments/${commentId}/like`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Quitar like de un comentario
  unlikeComment(commentId: number): Observable<any> {
    return this.http.delete(
      `${API_BASE}/likes/comments/${commentId}/unlike`,
      { headers: this.getAuthHeaders() }
    );
  }
}

export { Comment };
