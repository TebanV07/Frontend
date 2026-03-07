import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, CreateCommentDto, UpdateCommentDto, CommentResponse } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class PostCommentService {
  private apiUrl = '/api/v1/comments';
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

  getComments(postId: number, page: number = 1, limit: number = 20): Observable<Comment[]> {
  const params = new HttpParams()
    .set('skip', ((page - 1) * limit).toString())
    .set('limit', limit.toString());

  return this.http.get<Comment[]>(`${this.apiUrl}/posts/${postId}/comments`, { // ✅ CORRECTO
    params,
    headers: this.getAuthHeaders()
  });
}

  createComment(postId: number, comment: CreateCommentDto): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(
      `${this.apiUrl}/posts/${postId}/comments`,
      comment,
      { headers: this.getAuthHeaders() }
    );
  }

  getReplies(commentId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/${commentId}/replies`, {
      headers: this.getAuthHeaders() // ✅ AGREGA HEADERS
    });
  }
// Dar like a un comentario
likeComment(commentId: number): Observable<any> {
  return this.http.post(
    `/api/v1/likes/posts/comments/${commentId}/like`,
    {},
    { headers: this.getAuthHeaders() }
  );
}

// Quitar like a un comentario
unlikeComment(commentId: number): Observable<any> {
  return this.http.delete(
    `/api/v1/likes/posts/comments/${commentId}/unlike`,
    { headers: this.getAuthHeaders() }
  );
}

// Verificar si el comentario está likeado (opcional)
checkLike(commentId: number): Observable<any> {
  return this.http.get(
    `/api/v1/likes/posts/comments/${commentId}/check`,
    { headers: this.getAuthHeaders() }
  );
}

  updatePostComment(commentId: number, update: UpdateCommentDto): Observable<CommentResponse> {
    return this.http.put<CommentResponse>(`${this.apiUrl}/${commentId}`, update, {
      headers: this.getAuthHeaders()
    });
  }

  deletePostComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${commentId}`, {
      headers: this.getAuthHeaders()
    });
  }
}
