import { UserBasic } from './user.model';

export interface Post {
  // Identificación
  id: number;
  uuid: string;

  // Contenido
  content: string;
  original_language: string;

  // Media
  has_images: boolean;
  has_video: boolean;
  has_audio: boolean;
  video_url?: string; // viene del CreatePostRequest
  images?: PostImage[];

  // Usuario
  user_id: number;
  user?: UserBasic;

  // Contadores
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  views_count?: number;

  // Estado del usuario actual (frontend)
  isLiked?: boolean;
  isSaved?: boolean;

  // Visibilidad
  is_public: boolean;
  is_active: boolean;

  // Categorización
  tags?: string[];
  location_name?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;

  // Tiempo
  created_at: string;
  updated_at?: string;

  // UI
  showComments?: boolean;
}

export interface PostImage {
  id: number;
  post_id: number;
  image_url: string;
  thumbnail_url?: string;
  width: number;
  height: number;
  order: number;
  alt_text?: string;
}


/**
 * Interface para ubicación del post
 */
export interface PostLocation {
  name: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

/**
 * DTO para crear post
 */
export interface CreatePostDto {
  content: string;
  originalLanguage: string;
  images?: File[];
  isPublic?: boolean;
  tags?: string[];
  location?: PostLocation;
}

/**
 * DTO para actualizar post
 */
export interface UpdatePostDto {
  content?: string;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * Response para feed de posts
 */
export interface PostFeedResponse {
  posts: Post[];
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
}