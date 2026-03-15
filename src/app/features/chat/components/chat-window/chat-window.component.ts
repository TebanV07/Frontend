import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges, ViewChildren, QueryList
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import type { Conversation, Message } from '../../../../core/models';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { ChatService } from '../../../../core/services/chat.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FlagService } from '../../../../core/services/flag.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent, ChatInputComponent, TranslateModule],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent implements OnChanges {

  @Input() activeConversation: Conversation | null = null;
  @Input() messages: Message[] = [];
  @Input() typingUsers: number[] = [];

  onlineUsers: any[] = [];
  isUploadingFile = false;
  uploadError: string | null = null;

  @Output() messageSent = new EventEmitter<string>();
  @Output() typing = new EventEmitter<boolean>();

  @ViewChildren(MessageBubbleComponent) messageBubbles!: QueryList<MessageBubbleComponent>;

  private readonly uploadUrl = `${environment.apiUrl}/messages/upload`;

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
    private chatService: ChatService,
    private authService: AuthService,
    public flagService: FlagService
  ) {
    this.chatService.loadOnlineUsers();
    this.chatService.onlineUsers$.subscribe(list => { this.onlineUsers = list; });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeConversation'] || changes['messages']) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  private isOtherUserOnline(): boolean {
    if (!this.activeConversation?.other_user) return false;
    return this.onlineUsers.some(u => u.id === this.activeConversation?.other_user?.id);
  }

  getStatusText(): string {
    const typing = this.getTypingUserNames();
    if (typing) return typing;
    return this.isOtherUserOnline() ? 'En linea' : 'Desconectado';
  }

  onMessageSent(content: string): void {
    this.messageSent.emit(content);
    setTimeout(() => this.scrollToBottom(), 100);
  }

  onTyping(isTyping: boolean): void { this.typing.emit(isTyping); }

  scrollToBottom(): void {
    if (typeof document === 'undefined') return;
    const container = document.querySelector('.messages-container');
    if (container) container.scrollTop = container.scrollHeight;
  }

  isMessageSent(message: Message): boolean {
    return message.sender_id === this.getCurrentUserId();
  }

  private getCurrentUserId(): number {
    const userId = this.authService.getCurrentUserId();
    if (userId) return userId;
    if (typeof localStorage !== 'undefined') {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        try { return JSON.parse(currentUserStr).id || 0; } catch (e) {}
      }
    }
    return 0;
  }

  // ==================== ARCHIVO ADJUNTO ====================

  onFileAttached(file: File): void {
    if (!this.activeConversation) return;
    this.isUploadingFile = true;
    this.uploadError = null;

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post<{ url: string; media_type: string; filename: string }>(
      this.uploadUrl, formData, { headers }
    ).subscribe({
      next: (response) => {
        this.isUploadingFile = false;
        this.chatService.sendMessage(
          this.activeConversation!.id,
          '',
          [response.url],
          response.media_type
        );
        setTimeout(() => this.scrollToBottom(), 150);
      },
      error: (err) => {
        this.isUploadingFile = false;
        if (err.status === 413) this.uploadError = 'El archivo supera el limite de 10 MB.';
        else if (err.status === 400) this.uploadError = 'Tipo de archivo no permitido.';
        else this.uploadError = 'Error al subir el archivo. Intenta de nuevo.';
        setTimeout(() => this.uploadError = null, 4000);
      }
    });
  }

  // ==================== ACCIONES DE MENSAJES ====================

  onDeleteForMe(messageId: number): void { this.chatService.removeMessageLocally(messageId); }

  onForward(message: Message): void {
    const target = prompt('Escribe el ID de la conversacion destino');
    const convId = target ? parseInt(target, 10) : NaN;
    if (convId && !isNaN(convId)) {
      this.chatService.sendMessage(convId, message.content || '');
      alert('Mensaje reenviado');
    }
  }

  onShare(message: Message): void {
    if (navigator.share) {
      navigator.share({ text: message.content }).catch(err => console.warn(err));
    } else {
      navigator.clipboard.writeText(message.content || '').then(() => alert('Texto copiado al portapapeles'));
    }
  }

  // ==================== TRADUCCIÓN ====================

  onTranslateMessage(event: { message: Message, language: string }): void {
    const { message, language } = event;
    this.chatService.translateMessage(message.id, language).subscribe({
      next: (response) => {
        const bubble = this.messageBubbles.find(b => b.message.id === message.id);
        if (bubble) bubble.setTranslation(response.translated_content);
        this.chatService.replaceMessage({
          ...message,
          translations: { ...message.translations, [language]: response.translated_content }
        });
      },
      error: () => {
        const bubble = this.messageBubbles.find(b => b.message.id === message.id);
        if (bubble) bubble.setTranslationError('Error al traducir. Intenta de nuevo.');
      }
    });
  }

  onMessageEdited(event: { id: number; content: string }): void {
    this.chatService.updateMessage(event.id, event.content).subscribe({
      next: (msg) => console.debug('Mensaje editado:', msg.id),
      error: (err) => console.error('Error editando:', err)
    });
  }

  onMessageDeleted(messageId: number): void {
    this.chatService.deleteMessage(messageId).subscribe({
      next: () => console.debug('Mensaje eliminado:', messageId),
      error: (err) => console.error('Error eliminando:', err)
    });
  }

  getTypingUserNames(): string {
    if (!this.activeConversation || this.typingUsers.length === 0) return '';
    if (!this.activeConversation.other_user) return 'Escribiendo...';
    return `${this.activeConversation.other_user.name} esta escribiendo...`;
  }
}


