// app/features/feed/videos/video-overlay/video-overlay.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Video } from '../../../../core/services/video.service';
import { ShortNumberPipe } from "../../../../shared/pipes/short-number.pipe";

@Component({
  selector: 'app-video-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, ShortNumberPipe, TranslateModule],
  templateUrl: './video-overlay.component.html',
  styleUrls: ['./video-overlay.component.scss']
})
export class VideoOverlayComponent {
  @Input() video!: Video;
  @Output() like = new EventEmitter<Video>();
  @Output() comment = new EventEmitter<Video>();
  @Output() share = new EventEmitter<Video>();
  @Output() save = new EventEmitter<Video>();
  @Output() requestTranslation = new EventEmitter<{video: Video, language: string}>();

  // Estados locales
  showTranslationMenu = false;
  selectedSubtitleLanguage: string = '';
  private readonly apiBaseUrl = 'http://localhost:8001';

  // Idiomas disponibles para traduccion
  availableTranslationLanguages = [
    { code: 'es', name: 'Espanol', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Frances', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Portugues', flag: '🇵🇹' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', name: 'Japones', flag: '🇯🇵' },
    { code: 'zh', name: 'Chino', flag: '🇨🇳' },
    { code: 'ko', name: 'Coreano', flag: '🇰🇷' },
  ];

  ngOnInit() {
    // Establecer idioma de subtitulo por defecto (original)
    this.selectedSubtitleLanguage = this.video?.original_language || 'es';
  }

  // ==================== ACCIONES ====================

  onLike() {
    this.like.emit(this.video);
  }

  onComment() {
    this.comment.emit(this.video);
  }

  onShare() {
    this.share.emit(this.video);
  }

  onSave() {
    this.save.emit(this.video);
  }

  // ==================== TRADUCCION ====================

  toggleTranslationMenu() {
    this.showTranslationMenu = !this.showTranslationMenu;
  }

  onSubtitleLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newLanguage = select.value;

    // Si el idioma ya esta disponible, cambiar subtitulos
    if (this.video.available_languages?.includes(newLanguage)) {
      this.selectedSubtitleLanguage = newLanguage;
      // TODO: Actualizar track de subtitulos en el video player
    } else {
      // Si no esta disponible, solicitar traduccion
      if (confirm(`Los subtitulos en ${this.getLanguageName(newLanguage)} no estan disponibles. Deseas solicitarlos? (puede tardar unos minutos)`)) {
        this.requestTranslation.emit({
          video: this.video,
          language: newLanguage
        });
      } else {
        // Revertir seleccion
        select.value = this.selectedSubtitleLanguage;
      }
    }
  }

  requestVideoTranslation(targetLanguage: string) {
    this.requestTranslation.emit({
      video: this.video,
      language: targetLanguage
    });
    this.showTranslationMenu = false;
  }

  // ==================== HELPERS ====================

  getLanguageFlag(langCode: string): string {
    const lang = this.availableTranslationLanguages.find(l => l.code === langCode);
    return lang?.flag || '🌐';
  }

  getUserAvatarUrl(): string {
    const user = this.video?.user as any;
    const avatar = user?.avatar || user?.avatar_url || user?.profile_picture_url || user?.profile_image;

    if (!avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}`;
    }

    if (typeof avatar !== 'string') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}`;
    }

    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
      return avatar;
    }

    const normalizedPath = avatar.startsWith('/') ? avatar : `/${avatar}`;
    return `${this.apiBaseUrl}${normalizedPath}`;
  }

  getLanguageName(langCode: string): string {
    const lang = this.availableTranslationLanguages.find(l => l.code === langCode);
    return lang?.name || langCode.toUpperCase();
  }

  get availableSubtitles() {
    return this.availableTranslationLanguages.filter(lang =>
      this.video.available_languages?.includes(lang.code)
    );
  }

  get unavailableSubtitles() {
    return this.availableTranslationLanguages.filter(lang =>
      !this.video.available_languages?.includes(lang.code) &&
      lang.code !== this.video.original_language
    );
  }

  // ==================== FORMATEO ====================

  formatViews(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;

    return date.toLocaleDateString();
  }
}
