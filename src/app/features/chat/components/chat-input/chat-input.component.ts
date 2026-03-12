import { Component, Output, EventEmitter, ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss'
})
export class ChatInputComponent implements OnDestroy {
  @Output() messageSent = new EventEmitter<string>();
  @Output() typing = new EventEmitter<boolean>();
  @Output() fileAttached = new EventEmitter<File>();
  @Input() conversationId: number | null = null;

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;

  newMessage = '';
  isRecording = false;
  showEmojiPicker = false;

  private typingSubject = new Subject<boolean>();
  private isTyping = false;

  // para grabacion de voz real
  private mediaRecorder?: MediaRecorder;
  private recordedChunks: Blob[] = [];

  constructor(private router: Router) {
    // Debounce para indicador de escritura
    this.typingSubject.pipe(
      debounceTime(1000)
    ).subscribe(() => {
      this.isTyping = false;
      this.typing.emit(false);
    });
  }

  ngOnDestroy(): void {
    this.typingSubject.complete();
  }

  onInputChange(): void {
    if (!this.isTyping) {
      this.isTyping = true;
      this.typing.emit(true);
    }
    this.typingSubject.next(true);
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messageSent.emit(this.newMessage.trim());
      this.newMessage = '';
      this.isTyping = false;
      this.typing.emit(false);
      this.focusInput();
    }
  }

  onAttachFile() {
    // Antes de abrir el selector pedimos permisos de camara opcionalmente.
    this.ensurePermissions('camera').then(() => {
      if (this.fileInput) {
        this.fileInput.nativeElement.click();
      }
    }).catch(() => {
      // si no se conceden, no abrimos nada
    });
  }

  async onTakePhoto() {
    // Solicita permiso de camara explicitamente y abre un input especifico.
    const ok = await this.ensurePermissions('camera');
    if (!ok) {
      return;
    }
    if (this.cameraInput) {
      this.cameraInput.nativeElement.click();
    }
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    console.debug('Archivo seleccionado:', file);
    this.fileAttached.emit(file);

    input.value = '';
  }

  /**
   * Helper generico que intenta obtener permisos de camara o microfono
   * devolviendo true si se conceden y false en caso contrario.
   */
  private async ensurePermissions(kind: 'microphone' | 'camera'): Promise<boolean> {
    try {
      const constraints: MediaStreamConstraints =
        kind === 'microphone' ? { audio: true } : { video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (err: any) {
      console.warn(`Permiso de ${kind} denegado`, err);
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        alert(`Necesitas conceder acceso a la ${kind}. Revisa la configuracion de permisos o usa HTTPS.`);
      } else {
        alert(`No fue posible obtener permiso de ${kind}.`);
      }
      if (this.router) {
        this.router.navigate(['/permissions']);
      }
      return false;
    }
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
    this.focusInput();
    this.onInputChange();
  }

  async toggleVoiceRecording() {
    if (!this.isRecording) {
      const ok = await this.ensurePermissions('microphone');
      if (!ok) {
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) {
            this.recordedChunks.push(e.data);
          }
        };
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
          this.fileAttached.emit(file);
        };
        this.mediaRecorder.start();
        this.isRecording = true;
        console.debug('Iniciando grabacion de voz...');
      } catch (err: any) {
        console.warn('No se pudo acceder al microfono', err);
        alert('No fue posible iniciar la grabacion. ' +
              'Asegurate de conceder permisos y usar un contexto seguro.');
      }
    } else {
      this.isRecording = false;
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      console.debug('Deteniendo grabacion de voz...');
    }
  }

  focusInput() {
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    });
  }

  commonEmojis = [
    '😊', '😂', '🤣', '❤️', '👍', '🙏', '😍', '🤔',
    '😎', '🎉', '🔥', '✨', '💪', '👏', '🌟', '💯',
    '😢', '😮', '😅', '🥰', '😘', '🤗', '🎊', '🚀'
  ];
}

