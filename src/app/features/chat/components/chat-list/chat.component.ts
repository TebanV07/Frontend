import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatWindowComponent } from '../chat-window/chat-window.component';
import { ChatService, Conversation, Message } from '../../../../core/services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ChatWindowComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  messages: Message[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    // Cargar conversaciones del servicio
    this.chatService.getConversations().subscribe(convs => {
      this.conversations = convs;
    });

    // Escuchar cambios en la conversación activa
    this.chatService.getActiveConversation().subscribe(conv => {
      this.activeConversation = conv;
    });

    // Escuchar mensajes
    this.chatService.getCurrentMessages().subscribe(msgs => {
      this.messages = msgs;
    });
  }

  onConversationSelected(conversation: Conversation) {
    this.chatService.setActiveConversation(conversation);
    this.chatService.markAsRead(conversation.id);
  }

  onMessageSent(content: string) {
    if (this.activeConversation) {
      this.chatService.sendMessage(content, this.activeConversation.id).subscribe(message => {
        // El mensaje se agrega automáticamente a través del observable
        console.log('Mensaje enviado:', message);
      });
    }
  }

  getFormattedTime(date: Date): string {
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
}