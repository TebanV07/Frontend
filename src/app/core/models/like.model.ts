import { User } from "./user.model";

export interface Like {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
  user?: User;
}

export interface LikeToggleResponse {
  action: 'liked' | 'unliked';
  is_liked: boolean;
  likes_count: number;
}

export interface LikeCountResponse {
  likes_count: number;
}

export interface LikeCheckResponse {
  is_liked: boolean;
}

export interface LikeUser {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
  liked_at: string;
}


// ============================================
// core/models/post.model.ts (ACTUALIZADO)
// ============================================

export interface Post {
  id: number;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  user_id: number;
  created_at: string;
  updated_at?: string;
  
  // Relaciones
  author?: User;
  
  // Contadores
  likes_count: number;
  comments_count: number;
  shares_count?: number;
  
  // Estado del usuario actual
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface CreatePostDto {
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
}

export interface UpdatePostDto {
  content?: string;
    media_url?: string;
    media_type?: 'image' | 'video';
}