import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Comment, CreateCommentDto } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = 'http://localhost:8001/api/v1';

  private postCommentsSubject = new BehaviorSubject<Comment[]>([]);
  public postComments$ = this.postCommentsSubject.asObservable();

  private videoCommentsSubject = new BehaviorSubject<Comment[]>([]);
  public videoComments$ = this.videoCommentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ============== COMENTARIOS EN POSTS ==============

  /**
   * Obtener comentarios de un post
   * GET /api/v1/comments/posts/{post_id}/comments
   */
  getComments(postId: number, skip: number = 0, limit: number = 20): Observable<Comment[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    return this.http.get<Comment[]>(`${this.apiUrl}/comments/posts/${postId}/comments`, { params })
      .pipe(
        tap(comments => {
          this.postCommentsSubject.next(comments);
        })
      );
  }

  /**
   * Crear comentario en un post
   * POST /api/v1/comments/posts/{post_id}/comments
   */
  createComment(postId: number, data: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/comments/posts/${postId}/comments`, data)
      .pipe(
        tap(comment => {
          const current = this.postCommentsSubject.value;
          this.postCommentsSubject.next([comment, ...current]);
        })
      );
  }

  /**
   * Actualizar comentario de post
   * PUT /api/v1/comments/posts/comments/{comment_id}
   */
  updatePostComment(commentId: number, data: CreateCommentDto): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/comments/posts/comments/${commentId}`, data);
  }

  /**
   * Eliminar comentario de post
   * DELETE /api/v1/comments/posts/comments/{comment_id}
   */
  deletePostComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/posts/comments/${commentId}`)
      .pipe(
        tap(() => {
          const current = this.postCommentsSubject.value;
          const updated = current.filter(c => c.id !== commentId);
          this.postCommentsSubject.next(updated);
        })
      );
  }

  /**
   * Obtener respuestas a un comentario de post
   * GET /api/v1/comments/posts/comments/{comment_id}/replies
   */
  getPostCommentReplies(commentId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/comments/posts/comments/${commentId}/replies`);
  }

  /**
   * Responder a un comentario de post
   * POST /api/v1/comments/posts/comments/{comment_id}/reply
   */
  replyToPostComment(commentId: number, data: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/comments/posts/comments/${commentId}/reply`, data);
  }

  /**
   * Like a un comentario de post
   * POST /api/v1/comments/posts/comments/{comment_id}/like
   */
  likePostComment(commentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/comments/posts/comments/${commentId}/like`, {})
      .pipe(
        tap(() => {
          const current = this.postCommentsSubject.value;
          const updated = current.map(c => {
            if (c.id === commentId) {
              return { ...c, isLiked: true, likes_count: c.likes_count + 1 };
            }
            return c;
          });
          this.postCommentsSubject.next(updated);
        })
      );
  }

  /**
   * Unlike a un comentario de post
   * DELETE /api/v1/comments/posts/comments/{comment_id}/like
   */
  unlikePostComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/posts/comments/${commentId}/like`)
      .pipe(
        tap(() => {
          const current = this.postCommentsSubject.value;
          const updated = current.map(c => {
            if (c.id === commentId) {
              return { ...c, isLiked: false, likes_count: Math.max(0, c.likes_count - 1) };
            }
            return c;
          });
          this.postCommentsSubject.next(updated);
        })
      );
  }

  // ============== COMENTARIOS EN VIDEOS ==============

  /**
   * Obtener comentarios de un video
   * GET /api/v1/comments/videos/{video_id}/comments
   */
  getVideoComments(videoId: number, skip: number = 0, limit: number = 20): Observable<Comment[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    return this.http.get<Comment[]>(`${this.apiUrl}/comments/videos/${videoId}/comments`, { params })
      .pipe(
        tap(comments => {
          this.videoCommentsSubject.next(comments);
        })
      );
  }

  /**
   * Crear comentario en un video
   * POST /api/v1/comments/videos/{video_id}/comments
   */
  createVideoComment(videoId: number, data: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/comments/videos/${videoId}/comments`, data)
      .pipe(
        tap(comment => {
          const current = this.videoCommentsSubject.value;
          this.videoCommentsSubject.next([comment, ...current]);
        })
      );
  }

  /**
   * Actualizar comentario de video
   * PUT /api/v1/comments/videos/comments/{comment_id}
   */
  updateVideoComment(commentId: number, data: CreateCommentDto): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/comments/videos/comments/${commentId}`, data);
  }

  /**
   * Eliminar comentario de video
   * DELETE /api/v1/comments/videos/comments/{comment_id}
   */
  deleteVideoComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/videos/comments/${commentId}`)
      .pipe(
        tap(() => {
          const current = this.videoCommentsSubject.value;
          const updated = current.filter(c => c.id !== commentId);
          this.videoCommentsSubject.next(updated);
        })
      );
  }

  /**
   * Obtener respuestas a un comentario de video
   * GET /api/v1/comments/videos/comments/{comment_id}/replies
   */
  getVideoCommentReplies(commentId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/comments/videos/comments/${commentId}/replies`);
  }

  /**
   * Responder a un comentario de video
   * POST /api/v1/comments/videos/comments/{comment_id}/reply
   */
  replyToVideoComment(commentId: number, data: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/comments/videos/comments/${commentId}/reply`, data);
  }

  /**
   * Like a un comentario de video
   * POST /api/v1/comments/videos/comments/{comment_id}/like
   */
  likeVideoComment(commentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/comments/videos/comments/${commentId}/like`, {})
      .pipe(
        tap(() => {
          const current = this.videoCommentsSubject.value;
          const updated = current.map(c => {
            if (c.id === commentId) {
              return { ...c, isLiked: true, likes_count: c.likes_count + 1 };
            }
            return c;
          });
          this.videoCommentsSubject.next(updated);
        })
      );
  }

  /**
   * Unlike a un comentario de video
   * DELETE /api/v1/comments/videos/comments/{comment_id}/like
   */
  unlikeVideoComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/videos/comments/${commentId}/like`)
      .pipe(
        tap(() => {
          const current = this.videoCommentsSubject.value;
          const updated = current.map(c => {
            if (c.id === commentId) {
              return { ...c, isLiked: false, likes_count: Math.max(0, c.likes_count - 1) };
            }
            return c;
          });
          this.videoCommentsSubject.next(updated);
        })
      );
  }

  // ============== UTILIDADES ==============

  /**
   * Limpiar comentarios de posts
   */
  clearPostComments(): void {
    this.postCommentsSubject.next([]);
  }

  /**
   * Limpiar comentarios de videos
   */
  clearVideoComments(): void {
    this.videoCommentsSubject.next([]);
  }

  /**
   * Obtener comentarios actuales de posts
   */
  getCurrentPostComments(): Comment[] {
    return this.postCommentsSubject.value;
  }

  /**
   * Obtener comentarios actuales de videos
   */
  getCurrentVideoComments(): Comment[] {
    return this.videoCommentsSubject.value;
  }
}
