import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../core/services/chat.service';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss'
})
export class MessageBubbleComponent {
  @Input() message!: Message;
  @Input() isSent: boolean = false;
  @Output() translate = new EventEmitter<Message>();

  onTranslate() {
    this.translate.emit(this.message);
  }

  getFormattedTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}