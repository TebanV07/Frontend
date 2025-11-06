export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  timestamp: Date;
  read: boolean;
  // Para traducción
  originalLanguage?: string;
  translatedContent?: string;
  isTranslated?: boolean;
}