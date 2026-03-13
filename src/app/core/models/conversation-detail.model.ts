import type { Conversation } from './conversation.model';
import type { Message } from './message.model';
import type { UserMinimal } from './user-minimal.model';

export interface ConversationDetail extends Conversation {
  messages: Message[];
  participants?: UserMinimal[];
}

