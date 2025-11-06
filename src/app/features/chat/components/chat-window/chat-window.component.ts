import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation, Message } from '../../../../core/services/chat.service';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent, ChatInputComponent],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent implements OnChanges {
  @Input() activeConversation: Conversation | null = null;
  @Input() messages: Message[] = [];
  @Output() messageSent = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeConversation'] && this.activeConversation) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
    
    if (changes['messages']) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  onMessageSent(content: string) {
    this.messageSent.emit(content);
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  onTranslateMessage(message: Message) {
    if (message.translatedContent && message.translatedTo) {
      return;
    }
    
    message.isTranslating = true;
    
    // Simulación de traducción con IA
    setTimeout(() => {
      message.translatedContent = this.getMockTranslation(message.content, message.originalLanguage);
      message.translatedTo = 'English';
      message.aiTranslated = true;
      message.isTranslating = false;
    }, 1500);
  }

  getMockTranslation(text: string, originalLanguage: string): string {
    const translations: {[key: string]: string} = {
      '¡Hola! ¿Cómo estás? Me encanta la nueva función de traducción de videos.': 
        'Hello! How are you? I love the new video translation feature.',
      'Es increíble cómo podemos comunicarnos sin barreras de idioma. ¡El futuro está aquí! 🚀': 
        'It\'s incredible how we can communicate without language barriers. The future is here! 🚀',
      'こんにちは！新しいAI翻訳機能をテストしています。': 
        'Hello! I\'m testing the new AI translation feature.',
      'Bonjour! Cette fonction de traduction est fantastique!': 
        'Hello! This translation feature is fantastic!'
    };
    
    return translations[text] || `[Translated from ${originalLanguage}] ${text}`;
  }

  scrollToBottom() {
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const container = document.querySelector('.messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }

  isMessageSent(message: Message): boolean {
    return message.senderId === '1';
  }
}