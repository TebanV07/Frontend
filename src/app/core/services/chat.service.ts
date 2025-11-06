import { Injectable } from '@angular/core';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';

export interface ChatUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  language: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  originalLanguage: string;
  translatedContent?: string;
  translatedTo?: string;
  timestamp: Date;
  isTranslating?: boolean;
  aiTranslated?: boolean;
  messageType: 'text' | 'image' | 'video' | 'audio';
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: ChatUser[];
  lastMessage?: Message;
  unreadCount: number;
  isTranslationEnabled: boolean;
  preferredLanguage?: string;
  lastActivity: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private conversations$ = new BehaviorSubject<Conversation[]>([]);
  private activeConversation$ = new BehaviorSubject<Conversation | null>(null);
  private messages$ = new BehaviorSubject<Message[]>([]);

  private mockUsers: ChatUser[] = [
    {
      id: '2',
      name: 'María González',
      username: '@maria_g',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b05b?w=100&h=100&fit=crop&crop=face',
      language: 'Spanish',
      isOnline: true
    },
    {
      id: '3',
      name: 'Hiroshi Tanaka',
      username: '@hiroshi_t',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      language: 'Japanese',
      isOnline: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: '4',
      name: 'Sophie Laurent',
      username: '@sophie_l',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      language: 'French',
      isOnline: true
    },
    {
      id: '5',
      name: 'Carlos Silva',
      username: '@carlos_s',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      language: 'Portuguese',
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '6',
      name: 'Emma Wilson',
      username: '@emma_w',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      language: 'English',
      isOnline: true
    }
  ];

  private mockMessages: Message[] = [
    {
      id: '1',
      senderId: '2',
      recipientId: '1',
      content: '¡Hola! ¿Cómo estás? Me encanta la nueva función de traducción de videos.',
      originalLanguage: 'Spanish',
      translatedContent: 'Hello! How are you? I love the new video translation feature.',
      translatedTo: 'English',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      aiTranslated: true,
      messageType: 'text',
      isRead: true
    },
    {
      id: '2',
      senderId: '1',
      recipientId: '2',
      content: 'Hi María! I\'m doing great, thanks for asking. The AI translation is working amazingly well!',
      originalLanguage: 'English',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      messageType: 'text',
      isRead: true
    },
    {
      id: '3',
      senderId: '2',
      recipientId: '1',
      content: 'Es increíble cómo podemos comunicarnos sin barreras de idioma. ¡El futuro está aquí! 🚀',
      originalLanguage: 'Spanish',
      translatedContent: 'It\'s incredible how we can communicate without language barriers. The future is here! 🚀',
      translatedTo: 'English',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      aiTranslated: true,
      messageType: 'text',
      isRead: true
    },
    {
      id: '4',
      senderId: '1',
      recipientId: '2',
      content: 'Absolutely! And the voice translation for videos is mind-blowing.',
      originalLanguage: 'English',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      messageType: 'text',
      isRead: false
    }
  ];

  private mockConversations: Conversation[] = [
    {
      id: '1',
      participants: [this.mockUsers[0]],
      lastMessage: this.mockMessages[3],
      unreadCount: 1,
      isTranslationEnabled: true,
      preferredLanguage: 'English',
      lastActivity: new Date(Date.now() - 2 * 60 * 1000)
    },
    {
      id: '2',
      participants: [this.mockUsers[1]],
      lastMessage: {
        id: '5',
        senderId: '3',
        recipientId: '1',
        content: 'こんにちは！新しいAI翻訳機能をテストしています。',
        originalLanguage: 'Japanese',
        translatedContent: 'Hello! I\'m testing the new AI translation feature.',
        translatedTo: 'English',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        aiTranslated: true,
        messageType: 'text',
        isRead: false
      },
      unreadCount: 2,
      isTranslationEnabled: true,
      preferredLanguage: 'English',
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: '3',
      participants: [this.mockUsers[2]],
      lastMessage: {
        id: '6',
        senderId: '4',
        recipientId: '1',
        content: 'Bonjour! Cette fonction de traduction est fantastique!',
        originalLanguage: 'French',
        translatedContent: 'Hello! This translation feature is fantastic!',
        translatedTo: 'English',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        aiTranslated: true,
        messageType: 'text',
        isRead: true
      },
      unreadCount: 0,
      isTranslationEnabled: true,
      preferredLanguage: 'English',
      lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  ];

  constructor() {
    this.conversations$.next(this.mockConversations);
  }

  getConversations(): Observable<Conversation[]> {
    return this.conversations$.asObservable();
  }

  getActiveConversation(): Observable<Conversation | null> {
    return this.activeConversation$.asObservable();
  }

  getMessages(conversationId: string): Observable<Message[]> {
    if (conversationId === '1') {
      return of(this.mockMessages).pipe(delay(300));
    }
    return of([]).pipe(delay(300));
  }

  setActiveConversation(conversation: Conversation) {
    this.activeConversation$.next(conversation);
    this.getMessages(conversation.id).subscribe(messages => {
      this.messages$.next(messages);
    });
  }

  getCurrentMessages(): Observable<Message[]> {
    return this.messages$.asObservable();
  }

  sendMessage(content: string, conversationId: string): Observable<Message> {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: '1',
      recipientId: conversationId === '1' ? '2' : '3',
      content: content,
      originalLanguage: 'English',
      timestamp: new Date(),
      messageType: 'text',
      isRead: false
    };

    // Simular envío y agregar al array
    return of(newMessage).pipe(delay(500));
  }

  translateMessage(messageId: string, targetLanguage: string): Observable<Message> {
    // Simular traducción
    return of({} as Message).pipe(delay(1500));
  }

  markAsRead(conversationId: string): void {
    const conversations = this.conversations$.value;
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      this.conversations$.next([...conversations]);
    }
  }
}