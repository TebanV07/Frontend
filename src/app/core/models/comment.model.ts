export interface CommentUser {
  id: number;
  username: string;
  profile_picture?: string;
  native_language?: string;
}

export interface Comment {
  id: number;
  content: string;
  post_id?: number;
  video_id?: number;
  user_id: number;
  parent_id?: number;
  parent_comment_id?: number;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  user?: CommentUser;
  replies?: Comment[];
  likes_count: number;
  replies_count: number;
  is_liked?: boolean;
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
  post_id?: number;
  video_id?: number;
  user_id: number;
  parent_id?: number;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  user: CommentUser;
  replies?: CommentResponse[];
  likes_count: number;
  replies_count: number;
  has_liked: boolean;
  original_language?: string;
}
