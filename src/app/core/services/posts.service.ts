import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';


export interface CreatePostRequest {
  content: string;
  target_language?: string;
  video_url?: string;
}

export interface CreatePostResponse {
  post: Post;
  message: string;
}

export interface GetPostsResponse {
  data: Post[];
  results: Post[];
  posts: Post[];
  total: number;
  page: number;
  page_size: number;
}
export { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = 'http://localhost:8001/api/v1';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Obtener el token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    let token = '';
    
    // Solo acceder a localStorage si estamos en el navegador
    if (this.isBrowser) {
      token = localStorage.getItem('access_token') || '';
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Crear un nuevo post
   */
  createPost(postData: CreatePostRequest): Observable<CreatePostResponse> {
    return this.http.post<CreatePostResponse>(
      `${this.apiUrl}/posts`,
      postData,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener todos los posts (feed)
   */
  getPosts(page: number = 1, pageSize: number = 10): Observable<GetPostsResponse> {
    return this.http.get<GetPostsResponse>(
      `${this.apiUrl}/posts?page=${page}&page_size=${pageSize}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener un post específico por ID
   */
  getPostById(postId: string): Observable<Post> {
    return this.http.get<Post>(
      `${this.apiUrl}/posts/${postId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener posts de un usuario específico
   */
  getUserPosts(userId: number, page: number = 1, pageSize: number = 10): Observable<GetPostsResponse> {
    return this.http.get<GetPostsResponse>(
      `${this.apiUrl}/posts/user/${userId}?page=${page}&page_size=${pageSize}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Eliminar un post
   */
  deletePost(postId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/posts/${postId}`,
      { headers: this.getAuthHeaders() }
    );
  }

    // Dar like a un post
  likePost(postId: string): Observable<any> {
    console.log('🔄 Like post ID:', postId); // ← AGREGA ESTO
    console.log('📡 URL:', `${this.apiUrl}/likes/posts/${postId}/like`); // ← Y ESTO
    return this.http.post(
      `${this.apiUrl}/likes/posts/${postId}/like`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Quitar like de un post
  unlikePost(postId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/likes/posts/${postId}/unlike`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Obtener estado de like de un post
  getLikeStatus(postId: string): Observable<{ is_liked: boolean; likes_count: number }> {
    return this.http.get<{ is_liked: boolean; likes_count: number }>(
      `${this.apiUrl}/likes/posts/${postId}/status`,
      { headers: this.getAuthHeaders() }
    );
  }
}