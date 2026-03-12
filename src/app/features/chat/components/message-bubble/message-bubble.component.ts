import { Component, Input, Output, EventEmitter, HostBinding, HostListener, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import type { Message } from '../../../../core/models';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent implements OnChanges {

  @Input() message!: Message;
  @Input() isSent: boolean = false;

  @Output() translate = new EventEmitter<{ message: Message, language: string }>();
  @Output() edited = new EventEmitter<{ id: number, content: string }>();
  @Output() deleted = new EventEmitter<number>();
  @Output() deleteForMe = new EventEmitter<number>();
  @Output() forward = new EventEmitter<Message>();
  @Output() share = new EventEmitter<Message>();

  // menu de acciones que aparece tras mantener pulsado o clic derecho
  showActions: boolean = false;
  private longPressTimeout: any;

  constructor(private elementRef: ElementRef) {}


  @HostBinding('class.sent') get sent() {
    return this.isSent;
  }

  @HostBinding('class.received') get received() {
    return !this.isSent;
  }

  // Estado de traduccion
  showTranslation: boolean = false;
  currentTranslationLang: string | null = null;

  // Estado de edicion
  isEditing: boolean = false;
  editContent: string = '';

  translatedContent: string | null = null;
  isTranslating: boolean = false;
  translationError: string | null = null;

  // Idiomas disponibles
  availableLanguages = [
    { code: 'es', name: 'Espanol', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Frances', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portugues', flag: '🇵🇹' },
    { code: 'ja', name: 'Japones', flag: '🇯🇵' },
    { code: 'zh', name: 'Chino', flag: '🇨🇳' },
    { code: 'ko', name: 'Coreano', flag: '🇰🇷' }
  ];

  showLanguageMenu: boolean = false;

  // ==================== METODOS ====================

  toggleLanguageMenu(): void {
    this.showLanguageMenu = !this.showLanguageMenu;
  }

  /**
   * Obtener idioma preferido del remitente para mostrar badge
   */
  getSenderPreferredLang(): string | null {
    return this.message.sender?.preferred_translation_language ?? null;
  }

  get translationLanguages(): string[] {
    return this.message.translations ? Object.keys(this.message.translations) : [];
  }

  selectTranslation(lang: string): void {
    if (this.message.translations && this.message.translations[lang]) {
      this.translatedContent = this.message.translations[lang];
      this.currentTranslationLang = lang;
      this.showTranslation = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message?.translations) {
      const langs = Object.keys(this.message.translations);
      if (langs.length > 0) {
        // preselect first translation if not already set
        if (!this.translatedContent) {
          this.translatedContent = this.message.translations[langs[0]];
        }
      }
    }
  }

  // ----------------- acciones de menu -----------------
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showActions && !this.elementRef.nativeElement.contains(event.target)) {
      this.showActions = false;
    }
  }

  onMouseDown(): void {
    this.longPressTimeout = setTimeout(() => {
      this.showActions = true;
    }, 600);
  }

  onMouseUp(): void {
    clearTimeout(this.longPressTimeout);
  }

  onTouchStart(): void { this.onMouseDown(); }
  onTouchEnd(): void { this.onMouseUp(); }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.showActions = true;
  }

  closeActions(): void {
    this.showActions = false;
  }

  actionEdit(): void {
    this.startEdit();
    this.closeActions();
  }
  actionDeleteForMe(): void {
    this.deleteForMe.emit(this.message.id);
    this.closeActions();
  }
  actionDeleteForAll(): void {
    this.deleteMessage();
    this.closeActions();
  }
  actionForward(): void {
    this.forward.emit(this.message);
    this.closeActions();
  }
  actionShare(): void {
    this.share.emit(this.message);
    this.closeActions();
  }

  startEdit(): void {
    if (!this.isSent) return;
    this.isEditing = true;
    this.editContent = this.message.content || '';
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editContent = '';
  }

  saveEdit(): void {
    if (this.editContent.trim() === '') return;
    this.edited.emit({ id: this.message.id, content: this.editContent.trim() });
    this.isEditing = false;
  }

  deleteMessage(): void {
    if (!this.isSent) return;
    this.deleted.emit(this.message.id);
  }

  onTranslate(languageCode: string): void {
    this.showLanguageMenu = false;
    this.isTranslating = true;
    this.translationError = null;

    this.translate.emit({
      message: this.message,
      language: languageCode
    });
  }

  setTranslation(content: string): void {
    this.translatedContent = content;
    this.showTranslation = true;
    this.isTranslating = false;
  }

  setTranslationError(error: string): void {
    this.translationError = error;
    this.isTranslating = false;
  }

  toggleTranslationView(): void {
    this.showTranslation = !this.showTranslation;
  }

  getMessageTime(): string {
    if (!this.message.created_at) return '';

    const date = new Date(this.message.created_at);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  hasTranslation(): boolean {
    return !!this.translatedContent;
  }
}

