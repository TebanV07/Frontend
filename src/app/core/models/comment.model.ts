export interface User {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Comment {
  id: number;
  content: string;
  post_id: number;
  user_id: number;
  parent_comment_id?: number;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  
  // Relaciones
  author?: User;
  replies?: Comment[];
  
  // Contadores
  likes_count?: number;
  replies_count?: number;
}

export interface CreateCommentDto {
  content: string;
  parent_comment_id?: number;
}

export interface UpdateCommentDto {
  content: string;
}

export interface CommentResponse {
  id: number;
  content: string;
  post_id: number;
  user_id: number;
  parent_comment_id?: number;
  created_at: string;
  updated_at?: string;
  author: User;
  replies?: Comment[];
  likes_count: number;
  replies_count: number;
}