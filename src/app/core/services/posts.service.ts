import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';

export interface CreatePostRequest {
  content: string;
  target_language?: string;
  // Si se ha subido un video mediante /videos, pasar el ID aquí.
  video_id?: number;
}

// el endpoint de creación de posts devuelve directamente el objeto Post
export type CreatePostResponse = Post;

export interface GetPostsResponse {
  data: Post[];
  results: Post[];
  posts: Post[];
  total: number;
  page: number;
  page_size: number;
}

// 👇 NUEVAS INTERFACES PARA VIDEOS
export interface CreateVideoRequest {
  title: string;
  description?: string;
  target_language?: string;
}

export interface VideoResponse {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  status: string;
  created_at: string;
}

export { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = 'https://web-production-94f95.up.railway.app/api/v1';
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

    if (this.isBrowser) {
      token = localStorage.getItem('access_token') || '';
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtener headers para FormData (sin Content-Type)
   */
  private getAuthHeadersForFormData(): HttpHeaders {
    let token = '';

    if (this.isBrowser) {
      token = localStorage.getItem('access_token') || '';
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Crear un nuevo post
   */
  createPost(postData: CreatePostRequest): Observable<CreatePostResponse> {
    // backend acepta video_id dentro del cuerpo JSON
    return this.http.post<CreatePostResponse>(
      `${this.apiUrl}/posts`,
      postData,
      { headers: this.getAuthHeaders() }
    );
  }

  // ==================== MÉTODO PARA UPLOAD INTELIGENTE ====================
  smartUpload(
    file: File,
    content?: string,
    title?: string,
    description?: string,
    originalLanguage: string = 'es',
    category?: string,
    tags?: string[],
    isPublic: boolean = true
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (content !== undefined) formData.append('content', content);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('original_language', originalLanguage);
    formData.append('is_public', String(isPublic));
    if (category) formData.append('category', category);
    if (tags && tags.length > 0) formData.append('tags', JSON.stringify(tags));

    return this.http.post<any>(
      `${this.apiUrl}/upload`,
      formData,
      { headers: this.getAuthHeadersForFormData() }
    );
  }

  // ==================== MÉTODO CORREGIDO ====================

createVideo(
  videoFile: File,
  title?: string,
  description?: string,
  originalLanguage: string = 'es',
  category?: string,
  tags?: string[],
  isPublic: boolean = true
): Observable<VideoResponse> {
  const formData = new FormData();

  // Campo REQUERIDO con el nombre exacto que espera el backend
  formData.append('video_file', videoFile, videoFile.name);

  // Campos opcionales
  if (title) formData.append('title', title);
  if (description) formData.append('description', description);

  // Campos REQUERIDOS con defaults
  formData.append('original_language', originalLanguage);
  formData.append('is_public', String(isPublic));

  // Campos opcionales adicionales
  if (category) formData.append('category', category);
  if (tags && tags.length > 0) formData.append('tags', JSON.stringify(tags));

  console.log('📤 Enviando FormData:', {
    video_file: videoFile.name,
    size: `${(videoFile.size / 1024 / 1024).toFixed(2)} MB`,
    title,
    description,
    original_language: originalLanguage,
    is_public: isPublic
  });

  return this.http.post<VideoResponse>(
    `${this.apiUrl}/videos/`,
    formData,
    { headers: this.getAuthHeadersForFormData() }
  );
}

  // 👇 NUEVA FUNCIÓN: Obtener video por ID
  /**
   * Obtener un video por ID
   * Ruta: GET /api/v1/videos/{video_id}
   */
  getVideoById(videoId: number): Observable<VideoResponse> {
    return this.http.get<VideoResponse>(
      `${this.apiUrl}/videos/${videoId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 👇 NUEVA FUNCIÓN: Obtener video por UUID
  /**
   * Obtener un video por UUID
   * Ruta: GET /api/v1/videos/uuid/{video_uuid}
   */
  getVideoByUuid(videoUuid: string): Observable<VideoResponse> {
    return this.http.get<VideoResponse>(
      `${this.apiUrl}/videos/uuid/${videoUuid}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 👇 NUEVA FUNCIÓN: Obtener lista de videos
  /**
   * Obtener lista de videos
   * Ruta: GET /api/v1/videos/
   */
  getVideos(skip: number = 0, limit: number = 20): Observable<VideoResponse[]> {
    return this.http.get<VideoResponse[]>(
      `${this.apiUrl}/videos/?skip=${skip}&limit=${limit}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 👇 NUEVA FUNCIÓN: Actualizar video
  /**
   * Actualizar información de un video
   * Ruta: PUT /api/v1/videos/{video_id}
   */
  updateVideo(videoId: number, data: Partial<CreateVideoRequest>): Observable<VideoResponse> {
    return this.http.put<VideoResponse>(
      `${this.apiUrl}/videos/${videoId}`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  // 👇 NUEVA FUNCIÓN: Eliminar video
  /**
   * Eliminar un video
   * Ruta: DELETE /api/v1/videos/{video_id}
   */
  deleteVideo(videoId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/videos/${videoId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 👇 NUEVA FUNCIÓN: Traducir video existente
  /**
   * Traducir un video a otro idioma
   * Ruta: POST /api/v1/videos/{video_id}/translate
   */
  translateVideo(videoId: number, targetLanguage: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/videos/${videoId}/translate`,
      { target_language: targetLanguage },
      { headers: this.getAuthHeaders() }
    );
  }

  // 👇 NUEVA FUNCIÓN: Obtener traducciones de un video
  /**
   * Obtener todas las traducciones de un video
   * Ruta: GET /api/v1/videos/{video_id}/translations
   */
  getVideoTranslations(videoId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/videos/${videoId}/translations`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 👇 NUEVA FUNCIÓN: Like a video
  /**
   * Dar like a un video
   * Ruta: POST /api/v1/videos/{video_id}/like
   */
  likeVideo(videoId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/videos/${videoId}/like`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // 👇 NUEVA FUNCIÓN: Guardar video
  /**
   * Guardar un video
   * Ruta: POST /api/v1/videos/{video_id}/save
   */
  saveVideo(videoId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/videos/${videoId}/save`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // 👇 NUEVA FUNCIÓN: Compartir video
  /**
   * Compartir un video
   * Ruta: POST /api/v1/videos/{video_id}/share
   */
  shareVideo(videoId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/videos/${videoId}/share`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener todos los posts (feed)
   */
  getPosts(page: number = 1, pageSize: number = 10): Observable<GetPostsResponse> {
    return this.http.get<GetPostsResponse>(
      `${this.apiUrl}/posts/?page=${page}&page_size=${pageSize}`,
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
   * Actualizar un post (puede incluir contenido, tags o visibilidad)
   * Se envía como FormData porque el backend acepta form-data.
   */
  updatePost(
    postId: string,
    params: { content?: string; tags?: string[]; is_public?: boolean }
  ): Observable<Post> {
    const form = new FormData();
    if (params.content !== undefined) {
      form.append('content', params.content);
    }
    if (params.tags !== undefined) {
      form.append('tags', JSON.stringify(params.tags));
    }
    if (params.is_public !== undefined) {
      form.append('is_public', String(params.is_public));
    }
    return this.http.put<Post>(
      `${this.apiUrl}/posts/${postId}`,
      form,
      { headers: this.getAuthHeadersForFormData() }
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
   * Dar like a un post
   */
  likePost(postId: string): Observable<any> {
    console.log('🔄 Like post ID:', postId);
    console.log('📡 URL:', `${this.apiUrl}/likes/posts/${postId}/like`);
    return this.http.post(
      `${this.apiUrl}/likes/posts/${postId}/like`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Quitar like de un post
   */
  unlikePost(postId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/likes/posts/${postId}/unlike`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener estado de like de un post
   */
  getLikeStatus(postId: string): Observable<{ is_liked: boolean; likes_count: number }> {
    return this.http.get<{ is_liked: boolean; likes_count: number }>(
      `${this.apiUrl}/likes/posts/${postId}/status`,
      { headers: this.getAuthHeaders() }
    );
  }
  createPostWithMedia(
  content: string,
  images?: File[],
  video?: File,
  targetLanguage?: string,
  tags?: string[],
  locationName?: string,
  city?: string,
  country?: string
): Observable<Post> {
  const formData = new FormData();

  // Contenido
  formData.append('content', content);

  // Idioma
  if (targetLanguage) {
    formData.append('target_language', targetLanguage);
  }

  // Múltiples imágenes
  if (images && images.length > 0) {
    images.forEach(image => {
      formData.append('images', image);
    });
  }

  // Video
  if (video) {
    formData.append('video', video);
  }

  // Tags (como JSON string)
  if (tags && tags.length > 0) {
    formData.append('tags', JSON.stringify(tags));
  }

  // Location
  if (locationName) {
    formData.append('location_name', locationName);
  }
  if (city) {
    formData.append('city', city);
  }
  if (country) {
    formData.append('country', country);
  }

  return this.http.post<Post>(
    `${this.apiUrl}/posts/`,
    formData,
    { headers: this.getAuthHeadersForFormData() }
  );
}

toggleSavePost(postId: number): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/posts/${postId}/save`,
    {},
    { headers: this.getAuthHeaders() }
  );
}
getSavedPosts(skip: number = 0, limit: number = 20): Observable<Post[]> {
  return this.http.get<Post[]>(
    `${this.apiUrl}/posts/saved/me?skip=${skip}&limit=${limit}`,
    { headers: this.getAuthHeaders() }
  );
}
sharePost(postId: number): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/posts/${postId}/share`,
    {},
    { headers: this.getAuthHeaders() }
  );
}
translatePost(postId: number, targetLanguage: string, forceRetranslate = false): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/translations/posts/${postId}`,
    {
      target_language: targetLanguage,
      force_retranslate: forceRetranslate
    },
    { headers: this.getAuthHeaders() }
  );
}
deletePost(postId: string): Observable<void> {
  return this.http.delete<void>(
    `${this.apiUrl}/posts/${postId}`,
    { headers: this.getAuthHeadersForFormData() }
  );
}
reportPost(postId: number, reason: string, description?: string): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/reports`,
    { content_type: 'post', content_id: postId, reason, description },
    { headers: this.getAuthHeaders() }
  );
}
}

