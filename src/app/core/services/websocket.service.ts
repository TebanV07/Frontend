import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'online' | 'offline' | 'edit' | 'delete' | 'translation';
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private reconnectInterval = 5000;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  /**
   * Conectar al WebSocket
   */
  connect(): void {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const token = localStorage.getItem('access_token');

    if (!token) {
      console.warn('⚠️ No hay token, no se puede conectar al WebSocket');
      this.isConnecting = false;
      return;
    }

    try {
      // Construir URL del WebSocket
      const wsUrl = `ws://localhost:8001/api/v1/ws/chat?token=${token}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Mensaje WebSocket recibido:', message);
          this.messageSubject.next(message);
        } catch (error) {
          console.error('❌ Error parseando mensaje WebSocket:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        this.isConnecting = false;
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        this.isConnecting = false;
        this.socket = null;

        // Intentar reconectar
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

          setTimeout(() => {
            this.connect();
          }, this.reconnectInterval);
        } else {
          console.error('❌ Máximo de intentos de reconexión alcanzado');
        }
      };
    } catch (error) {
      console.error('❌ Error al crear WebSocket:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Enviar mensaje por WebSocket
   */
  send(message: WebSocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      console.log('📤 Mensaje enviado:', message);
    } else {
      console.warn('⚠️ WebSocket no está conectado');
      this.connect(); // Intentar reconectar
    }
  }

  /**
   * Obtener observable de mensajes
   */
  getMessages(): Observable<WebSocketMessage> {
    return this.messageSubject.asObservable();
  }

  /**
   * Desconectar WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Notificar que el usuario está escribiendo
   */
  sendTypingIndicator(conversationId: number, isTyping: boolean = true): void {
    this.send({
      type: 'typing',
      data: { conversation_id: conversationId, is_typing: isTyping }
    });
  }

  /**
   * Marcar mensajes como leídos
   */
  sendReadReceipt(messageIds: number[]): void {
    this.send({
      type: 'read',
      data: { message_ids: messageIds }
    });
  }
}
