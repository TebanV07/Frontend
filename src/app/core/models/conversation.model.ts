import { UserBasic } from './user.model';
import { Message } from './message.model';

export interface Conversation {
  id: number;
  participants: UserBasic[];
  lastMessage: Message;
  unreadCount: number;
  isOnline?: boolean;
}