import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

import {
  Observable,
  BehaviorSubject,
  interval,
  of,
  Subscription,
  combineLatest
} from 'rxjs';
import { WebSocketService, WebSocketMessage } from './websocket.service';

import {
  tap,
  switchMap,
  startWith,
  catchError,
  map,
  distinctUntilChanged
} from 'rxjs/operators';

import type {
  Message,
  Conversation,
  ConversationDetail,
  MessageListResponse
} from '../models';

// ==================== INTERFACES ====================

export interface TranslateMessageRequest {
  target_language: string;
}

export interface TranslateMessageResponse {
  message_id: number;
  translated_content: string;
  target_language: string;
  source_language: string;
}

// 🆕 Usuario online
export interface OnlineUser {
  id: number;
  username: string;
  name: string;
  avatar?: string;
  is_online: boolean;
}

// ========================================================================

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {

  private readonly apiUrl = `${environment.apiUrl}/messages`;
  private readonly wsApiUrl = `${environment.apiUrl}/ws`;
  private refreshIntervalMs = 5000;
  private refreshSub?: Subscription;

  // ======================================================
  // STATE
  // ======================================================

  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  public readonly conversations$ = this.conversationsSubject.asObservable();

  private activeConversationSubject = new BehaviorSubject<ConversationDetail | null>(null);
  public readonly activeConversation$ = this.activeConversationSubject.asObservable();

  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public readonly messages$ = this.messagesSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public readonly unreadCount$ = this.unreadCountSubject.asObservable();

  private typingUsersSubject = new BehaviorSubject<Record<number, number[]>>({});
  public readonly typingUsers$ = this.typingUsersSubject.asObservable();

  // 🆕 Usuarios online
  private onlineUsersSubject = new BehaviorSubject<OnlineUser[]>([]);
  public readonly onlineUsers$ = this.onlineUsersSubject.asObservable();

  // ======================================================
  // CONSTRUCTOR
  // ======================================================

  constructor(
    private http: HttpClient,
    private router: Router,
    private wsService: WebSocketService
  ) {
    this.startSmartAutoRefresh();
    this.wsService.getMessages().subscribe(msg => this.handleSocketMessage(msg));

    // 🆕 Cargar usuarios online al iniciar
    this.loadOnlineUsers();
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  // ======================================================
  // AUTO REFRESH
  // ======================================================

  private startSmartAutoRefresh(): void {
    this.refreshSub = interval(this.refreshIntervalMs)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (this.router.url.includes('/chat')) {
            return this.getConversations();
          }
          return of([]);
        }),
        catchError(() => of([]))
      )
      .subscribe();
  }

  setRefreshInterval(ms: number): void {
    this.refreshIntervalMs = ms;
    this.refreshSub?.unsubscribe();
    this.startSmartAutoRefresh();
  }

  // ======================================================
  // 🆕 USUARIOS ONLINE
  // ======================================================

  /**
   * Carga inicial de usuarios online desde el endpoint REST
   */
  loadOnlineUsers(): void {
    this.http.get<{ online_users: OnlineUser[]; total: number }>(
      `${this.wsApiUrl}/online-users`
    ).pipe(
      catchError(() => of({ online_users: [], total: 0 }))
    ).subscribe(res => {
      this.onlineUsersSubject.next(res.online_users);
    });
  }

  /**
   * Agregar o actualizar un usuario online en el store local
   */
  private addOnlineUser(user: OnlineUser): void {
    const current = this.onlineUsersSubject.value;
    const exists = current.find(u => u.id === user.id);
    if (!exists) {
      this.onlineUsersSubject.next([...current, user]);
    } else {
      // Actualizar datos si ya existe
      this.onlineUsersSubject.next(
        current.map(u => u.id === user.id ? { ...u, ...user, is_online: true } : u)
      );
    }
  }

  /**
   * Marcar usuario como offline en el store local
   */
  private removeOnlineUser(userId: number): void {
    const current = this.onlineUsersSubject.value;
    this.onlineUsersSubject.next(
      current.filter(u => u.id !== userId)
    );
  }

  // ======================================================
  // CONVERSACIONES
  // ======================================================

  getConversations(): Observable<Conversation[]> {
    return this.http
      .get<Conversation[]>(`${this.apiUrl}/conversations`)
      .pipe(
        tap(conversations => {
          this.conversationsSubject.next(conversations);
          this.updateUnreadCount(conversations);
        }),
        catchError(err => {
          console.error('Error cargando conversaciones', err);
          return of([]);
        })
      );
  }

  getConversationDetail(conversationId: number): Observable<ConversationDetail> {
    return this.http
      .get<ConversationDetail>(`${this.apiUrl}/conversations/${conversationId}`)
      .pipe(
        tap(detail => {
          this.activeConversationSubject.next(detail);
          this.messagesSubject.next(detail.messages ?? []);
        })
      );
  }

  createConversation(userId: number): Observable<Conversation> {
    return this.http
      .post<Conversation>(`${this.apiUrl}/conversations`, { user_id: userId })
      .pipe(tap(conv => this.pushConversation(conv)));
  }

  requestConversation(userId: number): Observable<{ message: string; conversation_id: number; created_conversation: boolean }> {
    return this.http.post<{ message: string; conversation_id: number; created_conversation: boolean }>(
      `${this.apiUrl}/conversations/request/${userId}`,
      {}
    );
  }

  createGroupConversation(participants: number[], name?: string): Observable<Conversation> {
    return this.http
      .post<Conversation>(`${this.apiUrl}/conversations`, { participants, name })
      .pipe(tap(conv => this.pushConversation(conv)));
  }

  setActiveConversation(conversation: Conversation): void {
    this.getConversationDetail(conversation.id).subscribe();
  }

  clearActiveConversation(): void {
    this.activeConversationSubject.next(null);
    this.messagesSubject.next([]);
  }

  // ======================================================
  // MENSAJES
  // ======================================================

  getMessages(conversationId: number, skip = 0, limit = 50): Observable<Message[]> {
    const params = new HttpParams().set('skip', skip).set('limit', limit);

    return this.http
      .get<MessageListResponse>(
        `${this.apiUrl}/conversations/${conversationId}/messages`,
        { params }
      )
      .pipe(
        map(res => res.messages),
        tap(messages => this.messagesSubject.next(messages)),
        catchError(() => of([]))
      );
  }

  sendMessage(
    conversationId: number,
    content: string,
    mediaUrls?: string[],
    mediaType?: string
  ): Observable<void> {
    this.wsService.send({
      type: 'message',
      data: {
        conversation_id: conversationId,
        content,
        media_urls: mediaUrls,
        media_type: mediaType
      }
    });
    return of();
  }

  updateMessage(messageId: number, content: string): Observable<Message> {
    return this.http
      .put<Message>(`${this.apiUrl}/messages/${messageId}`, { content })
      .pipe(
        tap(msg => {
          this.replaceMessage(msg);
          this.wsService.send({
            type: 'edit',
            data: { message_id: msg.id, content: msg.content, updated_at: msg.updated_at }
          });
        })
      );
  }

  deleteMessage(messageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/messages/${messageId}`).pipe(
      tap(() => {
        this.removeMessage(messageId);
        this.wsService.send({ type: 'delete', data: { message_id: messageId } });
      })
    );
  }

  /**
   * Elimina un mensaje únicamente en el cliente ("eliminar para mí").
   * No hace ninguna llamada al servidor.
   */
  public removeMessageLocally(messageId: number): void {
    this.removeMessage(messageId);
  }

  markMessageAsRead(messageId: number): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/messages/${messageId}/read`, {})
      .pipe(tap(() => this.markLocalMessageRead(messageId)));
  }

  markConversationAsRead(conversationId: number): Observable<Message[]> {
    return this.getMessages(conversationId);
  }

  // ======================================================
  // TRADUCCIÓN
  // ======================================================

  translateMessage(messageId: number, targetLanguage: string): Observable<TranslateMessageResponse> {
    return this.http.post<TranslateMessageResponse>(
      `${this.apiUrl}/messages/${messageId}/translate`,
      { target_language: targetLanguage }
    );
  }

  // ======================================================
  // STREAMS DERIVADOS
  // ======================================================

  public readonly activeConversationMessages$ = combineLatest([
    this.activeConversation$,
    this.messages$
  ]).pipe(
    map(([conv, messages]) => conv ? messages.filter(m => m.conversation_id === conv.id) : []),
    distinctUntilChanged()
  );

  // ======================================================
  // HELPERS PRIVADOS
  // ======================================================

  private pushConversation(conv: Conversation): void {
    const current = this.conversationsSubject.value;
    this.conversationsSubject.next([conv, ...current]);
  }

  private appendMessage(message: Message): void {
    const current = this.messagesSubject.value;
    this.messagesSubject.next([...current, message]);
  }

  /**
   * Reemplaza un mensaje en el estado local. Público para que componentes externos
   * puedan actualizar traducciones o ediciones sin volver a consultar al servidor.
   */
  public replaceMessage(message: Message): void {
    const updated = this.messagesSubject.value.map(m =>
      m.id === message.id ? message : m
    );
    this.messagesSubject.next(updated);
  }

  private removeMessage(messageId: number): void {
    this.messagesSubject.next(
      this.messagesSubject.value.filter(m => m.id !== messageId)
    );
  }

  private markLocalMessageRead(messageId: number): void {
    const messages = this.messagesSubject.value.map(m =>
      m.id === messageId ? { ...m, is_read: true } : m
    );
    this.messagesSubject.next(messages);
  }

  private applyEditedMessage(data: any): void {
    const { id, content, updated_at } = data;
    const messages = this.messagesSubject.value.map(m =>
      m.id === id ? { ...m, content, updated_at, is_edited: true } : m
    );
    this.messagesSubject.next(messages);
  }

  private applyDeletedMessage(data: any): void {
    this.removeMessage(data.id);
  }

  private applyTranslation(data: any): void {
    const { message_id, target_language, translated_content } = data;
    const messages = this.messagesSubject.value.map(m =>
      m.id === message_id
        ? { ...m, translations: { ...(m.translations || {}), [target_language]: translated_content } }
        : m
    );
    this.messagesSubject.next(messages);
  }

  private updateConversationLastMessage(conversationId: number, message: Message): void {
    const conversations = this.conversationsSubject.value.map(conv =>
      conv.id === conversationId
        ? { ...conv, last_message: message, last_message_at: message.created_at }
        : conv
    );
    this.conversationsSubject.next(conversations);
  }

  private updateUnreadCount(conversations: Conversation[]): void {
    const total = conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);
    this.unreadCountSubject.next(total);
  }

  // ======================================================
  // WEBSOCKET
  // ======================================================

  sendTypingIndicator(conversationId: number, isTyping: boolean = true): void {
    this.wsService.send({
      type: 'typing',
      data: { conversation_id: conversationId, is_typing: isTyping }
    });
  }

  sendReadReceipt(messageIds: number[]): void {
    this.wsService.send({ type: 'read', data: { message_ids: messageIds } });
  }

  getTypingUsers(conversationId: number): Observable<number[]> {
    return this.typingUsers$.pipe(map(m => m[conversationId] || []));
  }

  private handleSocketMessage(msg: WebSocketMessage): void {
    switch (msg.type) {
      case 'message':
        this.processIncomingMessage(msg.data);
        break;
      case 'typing':
        this.updateTypingUsers(msg.data);
        break;
      case 'read':
        this.applyReadReceipt(msg.data);
        break;
      case 'edit':
        this.applyEditedMessage(msg.data);
        break;
      case 'delete':
        this.applyDeletedMessage(msg.data);
        break;

      // 🆕 Usuarios online/offline en tiempo real
      case 'online':
        this.addOnlineUser({
          id: msg.data.user_id,
          username: msg.data.username || '',
          name: msg.data.name || msg.data.username || '',
          avatar: msg.data.avatar,
          is_online: true
        });
        break;
      case 'offline':
        this.removeOnlineUser(msg.data.user_id);
        break;
      case 'translation':
        this.applyTranslation(msg.data);
        break;
    }
  }

  private processIncomingMessage(data: any): void {
    const message: Message = data;
    this.appendMessage(message);
    this.updateConversationLastMessage(message.conversation_id, message);

    const active = this.activeConversationSubject.value;
    if (!active || active.id !== message.conversation_id) {
      const convs = this.conversationsSubject.value.map(c => {
        if (c.id === message.conversation_id) {
          return {
            ...c,
            unread_count: (c.unread_count || 0) + 1,
            last_message: message,
            last_message_at: message.created_at
          };
        }
        return c;
      });
      this.conversationsSubject.next(convs);
      this.updateUnreadCount(convs);
    }
  }

  private updateTypingUsers(data: any): void {
    const { conversation_id, user_id, is_typing } = data;
    const current = this.typingUsersSubject.value;
    const list = [...(current[conversation_id] || [])];

    if (is_typing) {
      if (!list.includes(user_id)) list.push(user_id);
    } else {
      const idx = list.indexOf(user_id);
      if (idx !== -1) list.splice(idx, 1);
    }
    this.typingUsersSubject.next({ ...current, [conversation_id]: list });
  }

  private applyReadReceipt(data: { message_ids: number[]; read_by_user_id?: number }): void {
    data.message_ids.forEach((id: number) => this.markLocalMessageRead(id));
  }
}

