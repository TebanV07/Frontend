// post.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../../core/models/post.model';
import { PostsService } from '../../../core/services/posts.service';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { FormsModule } from '@angular/forms';

// Importa los componentes de features
import { CommentListComponent } from '../../../features/posts/comments/comment-list/comment-list.component';
import { LikeButtonComponent } from '../../../features/posts/likes/likes-button/likes-button.component';
import { LikeCountComponent } from '../../../features/posts/likes/likes-count/likes-count.component';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CommentListComponent,
    LikeButtonComponent,
    LikeCountComponent
  ],
})
export class PostComponent implements OnInit {
  @Input() post!: Post;
  showComments = false;
  comments: Comment[] = [];
  loadingComments = false;

  // 🆕 Variables para traducción
  showTranslation = false;
  translatedContent = '';
  isTranslating = false;
  userLanguage = 'en'; // Idioma del usuario actual
  selectedTranslationLanguage: string = 'es'; // 🆕 Idioma seleccionado para traducir
  lastTranslatedLanguage: string = ''; // 🆕 Último idioma traducido

  // 🆕 Lista de idiomas disponibles
  availableLanguages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
  ];

  // Para el currentUserId - reemplaza con tu lógica real de autenticación
  currentUserId: number = 1;

  // URL base del backend
  private readonly apiBaseUrl = 'http://localhost:8001';

  constructor(
    private postsService: PostsService,
    private commentService: CommentService
  ) {}

  ngOnInit(): void {
    // Obtener idioma del usuario desde localStorage o auth service
    this.userLanguage = localStorage.getItem('userLanguage') || 'en';
    
    // 🆕 Detectar idioma del navegador para el selector
    const browserLang = navigator.language.split('-')[0];
    if (this.availableLanguages.some(lang => lang.code === browserLang)) {
      this.selectedTranslationLanguage = browserLang;
    }
    
    console.log('PostComponent ngOnInit — post id:', this.post?.id, 'post.original_language:', this.post?.original_language, 'userLanguage:', this.userLanguage, 'selectedTranslationLanguage:', this.selectedTranslationLanguage);
  }

  // ==================== BANDERAS DE IDIOMAS ====================
  getLanguageFlag(langCode: string): string {
    const flags: { [key: string]: string } = {
      'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹',
      'pt': '🇵🇹', 'ru': '🇷🇺', 'zh': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷',
      'ar': '🇸🇦', 'hi': '🇮🇳', 'nl': '🇳🇱', 'sv': '🇸🇪', 'no': '🇳🇴',
      'da': '🇩🇰', 'fi': '🇫🇮', 'pl': '🇵🇱', 'tr': '🇹🇷', 'el': '🇬🇷',
      'he': '🇮🇱', 'th': '🇹🇭', 'vi': '🇻🇳', 'id': '🇮🇩',
    };
    return flags[langCode?.toLowerCase()] || '🌐';
  }

  getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'en': 'English', 'es': 'Español', 'fr': 'Français', 'de': 'Deutsch',
      'it': 'Italiano', 'pt': 'Português', 'ru': 'Русский', 'zh': '中文',
      'ja': '日本語', 'ko': '한국어', 'ar': 'العربية', 'hi': 'हिन्दी',
      'nl': 'Nederlands', 'pl': 'Polski', 'tr': 'Türkçe',
    };
    return languages[code] || code?.toUpperCase() || 'Unknown';
  }

  // ==================== TRADUCCIÓN ====================
  
  // Ahora devuelve true solo si original_language está definido y coincide con el idioma del usuario
  isCurrentUserLanguage(): boolean {
    return !!this.post?.original_language && this.post.original_language === this.userLanguage;
  }

  // 🆕 Método para cambiar el idioma de traducción
  onTranslationLanguageChange(event: Event): void {
    const newLanguage = (event.target as HTMLSelectElement).value;
    this.selectedTranslationLanguage = newLanguage;
    
    console.log('🔄 Idioma cambiado a:', newLanguage);
    
    // Si ya está mostrando una traducción, obtener la nueva automáticamente
    if (this.showTranslation) {
      this.translatedContent = ''; // Limpiar traducción anterior
      this.lastTranslatedLanguage = ''; // Reset
      this.showTranslation = false; // Ocultar temporalmente
      this.toggleTranslation(); // Obtener nueva traducción
    }
  }

  toggleTranslation(): void {
    if (this.showTranslation) {
      // Mostrar original
      this.showTranslation = false;
      return;
    }

    // 🔄 Si ya tenemos la traducción EN EL IDIOMA SELECCIONADO, mostrarla
    if (this.translatedContent && this.lastTranslatedLanguage === this.selectedTranslationLanguage) {
      console.log('✅ Usando traducción en cache para:', this.selectedTranslationLanguage);
      this.showTranslation = true;
      return;
    }

    // Obtener traducción del backend
    this.isTranslating = true;
    console.log('🌐 Solicitando traducción:', {
      postId: this.post.id,
      fromLanguage: this.post.original_language,
      toLanguage: this.selectedTranslationLanguage // ✅ Usa el idioma seleccionado
    });

    this.postsService.translatePost(this.post.id, this.selectedTranslationLanguage) // ✅ CAMBIADO
      .subscribe({
        next: (response) => {
          console.log('✅ Traducción recibida:', response);
          // Aceptamos response.translated_content o response.content o la propia respuesta si viene en otro formato
          this.translatedContent = response?.translated_content || response?.content || (typeof response === 'string' ? response : '');
          this.lastTranslatedLanguage = this.selectedTranslationLanguage; // 🆕 Guardar idioma de esta traducción
          this.showTranslation = true;
          this.isTranslating = false;
        },
        error: (error) => {
          console.error('❌ Error al traducir:', error);
          
          // 🆕 Fallback: Simulación temporal si el endpoint no está implementado
          if (error?.status === 404 || error?.status === 501) {
            console.warn('⚠️ Endpoint no disponible, usando simulación...');
            this.simulateTranslation();
          } else {
            alert('Error al traducir el contenido. Por favor, intenta de nuevo.');
            this.isTranslating = false;
          }
        }
      });
  }

  // 🆕 MÉTODO FALLBACK de simulación (solo si el backend no está listo)
  private simulateTranslation(): void {
    setTimeout(() => {
      this.translatedContent = `[AI Translated from ${this.getLanguageName(this.post.original_language)} to ${this.getLanguageName(this.selectedTranslationLanguage)}]\n\n${this.post.content}`;
      this.lastTranslatedLanguage = this.selectedTranslationLanguage;
      this.showTranslation = true;
      this.isTranslating = false;
    }, 1000);
  }

  // ==================== URLS ====================

  getFullImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${this.apiBaseUrl}${imageUrl}`;
  }

  getFullVideoUrl(videoUrl: string): string {
    if (!videoUrl) return '';
    if (videoUrl.startsWith('http')) return videoUrl;
    return `${this.apiBaseUrl}${videoUrl}`;
  }

  // ==================== ERRORES ====================

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.error('❌ Error loading image:', img.src);
    img.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
  }

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    console.error('❌ Error loading video:', video.src);
  }

  // ==================== COMENTARIOS ====================

  toggleComments(): void {
    if (!this.post?.id) {
      console.error('❌ Cannot load comments: post.id is undefined', this.post);
      return;
    }
    this.showComments = !this.showComments;
  }

  onCommentCreated(comment: Comment): void {
    this.post.comments_count++;
  }

  onCommentFormCreated(comment: Comment): void {
    this.post.comments_count++;
  }

  onCommentFormCancelled(): void {
    console.log('Comment creation cancelled');
  }

  // ==================== LIKES ====================

  onLikeToggled(event: { isLiked: boolean; likesCount: number }): void {
    console.log('✅ Like toggled:', event);
    this.post.is_liked = event.isLiked;
    this.post.likes_count = event.likesCount;
  }

  // ==================== TIEMPO RELATIVO ====================
  getRelativeTime(date: string): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  }
}