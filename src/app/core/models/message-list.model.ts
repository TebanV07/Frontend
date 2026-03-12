import { Message } from './message.model';

export interface MessageListResponse {
  messages: Message[];
  total: number;
  skip: number;
  limit: number;
}
