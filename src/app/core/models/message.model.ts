import type { UserMinimal } from './user-minimal.model';

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content?: string;
  original_language?: string;

  has_media: boolean;
  media_urls?: string[];
  media_type?: string;

  is_read: boolean;
  is_edited: boolean;
  is_deleted: boolean;

  created_at: string;
  updated_at: string;
  read_at?: string;

  sender?: UserMinimal;
  translations?: { [language: string]: string };
}

