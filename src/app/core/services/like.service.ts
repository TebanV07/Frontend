import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Like {
  id: number;
  user_id: number;
  post_id?: number;
  video_id?: number;
  comment_id?: number;
  created_at: string;
}

export interface LikeStatus {
  is_liked: boolean;
  likes_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private apiUrl = 'http://localhost:8001/api/v1';

  // BehaviorSubjects para tracking de likes
  private postLikesSubject = new BehaviorSubject<{ [key: number]: boolean }>({});
  public postLikes$ = this.postLikesSubject.asObservable();

  private videoLikesSubject = new BehaviorSubject<{ [key: number]: boolean }>({});
  public videoLikes$ = this.videoLikesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ============== LIKES EN POSTS ==============

  /**
   * Dar like a un post
   * POST /api/v1/likes/posts/{post_id}/like
   */
  likePost(postId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/likes/posts/${postId}/like`, {})
      .pipe(
        tap(() => {
          const current = this.postLikesSubject.value;
          this.postLikesSubject.next({ ...current, [postId]: true });
        })
      );
  }

  /**
   * Quitar like de un post
   * DELETE /api/v1/likes/posts/{post_id}/unlike
   */
  unlikePost(postId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/likes/posts/${postId}/unlike`)
      .pipe(
        tap(() => {
          const current = this.postLikesSubject.value;
          this.postLikesSubject.next({ ...current, [postId]: false });
        })
      );
  }

  /**
   * Verificar si un post está likeado
   */
  isPostLiked(postId: number): boolean {
    return this.postLikesSubject.value[postId] || false;
  }

  // ============== LIKES EN VIDEOS ==============

  /**
   * Dar like a un video
   * POST /api/v1/likes/videos/{video_id}/like
   */
  likeVideo(videoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/likes/videos/${videoId}/like`, {})
      .pipe(
        tap(() => {
          const current = this.videoLikesSubject.value;
          this.videoLikesSubject.next({ ...current, [videoId]: true });
        })
      );
  }

  /**
   * Quitar like de un video
   * DELETE /api/v1/likes/videos/{video_id}/unlike
   */
  unlikeVideo(videoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/likes/videos/${videoId}/unlike`)
      .pipe(
        tap(() => {
          const current = this.videoLikesSubject.value;
          this.videoLikesSubject.next({ ...current, [videoId]: false });
        })
      );
  }

  /**
   * Verificar si un video está likeado
   */
  isVideoLiked(videoId: number): boolean {
    return this.videoLikesSubject.value[videoId] || false;
  }

  // ============== LIKES EN COMENTARIOS ==============

  /**
   * Dar like a un comentario
   * POST /api/v1/likes/comments/{comment_id}/like
   */
  likePostComment(commentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/likes/comments/${commentId}/like`, {});
  }

  /**
   * Quitar like de un comentario
   * DELETE /api/v1/likes/comments/{comment_id}/unlike
   */
  unlikePostComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/likes/comments/${commentId}/unlike`);
  }

  /**
   * Dar like a un comentario de video
   * POST /api/v1/likes/comments/{comment_id}/like
   */
  likeVideoComment(commentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/likes/comments/${commentId}/like`, {});
  }

  /**
   * Quitar like de un comentario de video
   * DELETE /api/v1/likes/comments/{comment_id}/unlike
   */
  unlikeVideoComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/likes/comments/${commentId}/unlike`);
  }

  // ============== UTILIDADES ==============

  /**
   * Actualizar estado de likes de múltiples posts
   */
  updatePostLikes(postIds: number[], isLiked: boolean): void {
    const current = this.postLikesSubject.value;
    const updated = { ...current };
    postIds.forEach(id => updated[id] = isLiked);
    this.postLikesSubject.next(updated);
  }

  /**
   * Actualizar estado de likes de múltiples videos
   */
  updateVideoLikes(videoIds: number[], isLiked: boolean): void {
    const current = this.videoLikesSubject.value;
    const updated = { ...current };
    videoIds.forEach(id => updated[id] = isLiked);
    this.videoLikesSubject.next(updated);
  }
}
