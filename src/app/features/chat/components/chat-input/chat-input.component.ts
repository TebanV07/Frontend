import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss'
})
export class ChatInputComponent {
  @Output() messageSent = new EventEmitter<string>();
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLInputElement>;
  
  newMessage = '';
  isRecording = false;
  showEmojiPicker = false;

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messageSent.emit(this.newMessage.trim());
      this.newMessage = '';
      this.focusInput();
    }
  }

  onAttachFile() {
    // Simulación de adjuntar archivo
    console.log('Adjuntar archivo');
    // Aquí iría la lógica para abrir el selector de archivos
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
    this.focusInput();
  }

  toggleVoiceRecording() {
    this.isRecording = !this.isRecording;
    if (this.isRecording) {
      console.log('Iniciando grabación de voz...');
      // Aquí iría la lógica de grabación de voz
    } else {
      console.log('Deteniendo grabación de voz...');
    }
  }

  focusInput() {
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    });
  }

  // Emojis comunes para el picker
  commonEmojis = [
    '😊', '😂', '🤣', '❤️', '👍', '🙏', '😍', '🤔', 
    '😎', '🎉', '🔥', '✨', '💪', '👏', '🌟', '💯',
    '😢', '😮', '😅', '🥰', '😘', '🤗', '🎊', '🚀'
  ];
}