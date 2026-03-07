import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatWindowComponent } from '../chat-window/chat-window.component';
import { ChatService, OnlineUser } from '../../../../core/services/chat.service';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { Subscription } from 'rxjs';

import type {
  Conversation,
  ConversationDetail,
  Message
} from '../../../../core/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ChatWindowComponent,
    HeaderComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {

  conversations: Conversation[] = [];
  activeConversation: ConversationDetail | null = null;
  messages: Message[] = [];
  typingUsers: Record<number, number[]> = {};

  // 🆕 Usuarios online
  onlineUsers: OnlineUser[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService) {}

  /**
   * Devuelve idioma preferido de traducción del usuario (si existe).
   * Se usa desde la plantilla para evitar accesos directos a propiedades
   * que a veces el verificador de plantillas no reconoce correctamente.
   */
  getPreferredLang(user?: { preferred_translation_language?: string }): string | null {
    return user?.preferred_translation_language ?? null;
  }

  ngOnInit(): void {

    // Conversaciones
    this.subscriptions.push(
      this.chatService.conversations$.subscribe(convs => {
        this.conversations = convs;
      })
    );

    // Conversación activa
    this.subscriptions.push(
      this.chatService.activeConversation$.subscribe(conv => {
        this.activeConversation = conv;
      })
    );

    // Mensajes
    this.subscriptions.push(
      this.chatService.messages$.subscribe(msgs => {
        this.messages = msgs;
      })
    );

    // Typing indicators
    this.subscriptions.push(
      this.chatService.typingUsers$.subscribe(typing => {
        this.typingUsers = typing;
      })
    );

    // 🆕 Usuarios online
    this.subscriptions.push(
      this.chatService.onlineUsers$.subscribe(users => {
        this.onlineUsers = users;
      })
    );

    // Carga inicial
    this.chatService.getConversations().subscribe();
    this.chatService.loadOnlineUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ======================================================
  // EVENTOS DE UI
  // ======================================================

  onConversationSelected(conversation: Conversation): void {
    this.chatService.setActiveConversation(conversation);
    this.chatService.markConversationAsRead(conversation.id).subscribe();
  }

  onMessageSent(content: string): void {
    if (!this.activeConversation) return;
    this.chatService.sendMessage(this.activeConversation.id, content);
  }

  onTyping(conversationId: number, isTyping: boolean): void {
    this.chatService.sendTypingIndicator(conversationId, isTyping);
  }

  // 🆕 Abrir conversación desde un usuario online
  onOnlineUserClick(user: OnlineUser): void {
    this.chatService.createConversation(user.id).subscribe({
      next: (conv) => this.chatService.setActiveConversation(conv),
      error: () => {
        // Si ya existe la conversación, buscarla en la lista
        const existing = this.conversations.find(
          c => c.other_user?.id === user.id
        );
        if (existing) this.chatService.setActiveConversation(existing);
      }
    });
  }

  // ======================================================
  // HELPERS
  // ======================================================

  getFormattedTime(date?: string | Date): string {
    if (!date) return '';

    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }

  isUserTyping(conversationId: number): boolean {
    const typing = this.typingUsers[conversationId];
    return !!typing && typing.length > 0;
  }

  // 🆕 Verificar si un contacto específico está online
  isContactOnline(userId?: number): boolean {
    if (!userId) return false;
    return this.onlineUsers.some(u => u.id === userId);
  }

  getAvatarUrl(avatar?: string): string {
    return avatar || 'assets/default-avatar.png';
  }

  getTypingUserNames(conversationId: number): string {
    const conversation = this.activeConversation;
    if (!conversation) return '';

    const typingIds = this.typingUsers[conversationId] || [];
    const participants = conversation.participants || [];

    const typingNames = typingIds
      .map(id => {
        const user = participants.find(p => p.id === id);
        if (!user) return '';
        return user.name || user.username || '';
      })
      .filter(Boolean);

    if (typingNames.length === 1) return `${typingNames[0]} está escribiendo...`;
    if (typingNames.length === 2) return `${typingNames[0]} y ${typingNames[1]} están escribiendo...`;
    if (typingNames.length > 2) return 'Varios usuarios están escribiendo...';
    return '';
  }
  getOnlineUserDisplayName(user: OnlineUser): string {
  const name = user.name || user.username;
  return name.split(' ')[0];
}
}
