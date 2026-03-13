import type { Message } from './message.model';
import type { UserMinimal } from './user-minimal.model';

export interface Conversation {
isTranslationEnabled: any;
  id: number;
  type: 'direct' | 'group';
  name?: string;

  last_message_content?: string;
  last_message_at?: string;

  created_at: string;
  updated_at: string;

  unread_count?: number;

  other_user?: UserMinimal;
  last_message?: Message;
}

