import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Post } from '../../../../core/models/post.model';
import { PostsService } from '../../../../core/services/posts.service';  // ← AGREGAR IMPORT
import { LikeButtonComponent } from '../../likes/likes-button/likes-button.component';
import { LikeCountComponent } from '../../likes/likes-count/likes-count.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, LikeButtonComponent, LikeCountComponent],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent {
  @Input() post!: Post;
  @Input() currentUserId?: number;
  @Output() postDeleted = new EventEmitter<number>();
  @Output() postUpdated = new EventEmitter<Post>();
  @Output() saveToggled = new EventEmitter<number>();
  @Input() userLanguage = 'en';  // Idioma del usuario

  // Estado de traducción
  showTranslation = false;
  translatedContent = '';
  isTranslating = false;

  showDropdown = false;
  
  private readonly apiBaseUrl = 'http://localhost:8001';

  // ✅ INYECTAR EL SERVICIO EN EL CONSTRUCTOR
  constructor(private postsService: PostsService) {}

  get isOwnPost(): boolean {
    return this.currentUserId === this.post.user_id;
  }

  get formattedDate(): string {
    const date = new Date(this.post.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

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

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.error('❌ Error loading image:', img.src);
  }

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    console.error('❌ Error loading video:', video.src);
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  onLikeToggled(event: { isLiked: boolean; likesCount: number }): void {
    this.post.is_liked = event.isLiked;
    this.post.likes_count = event.likesCount;
  }

  onSavePost(): void {
    this.saveToggled.emit(this.post.id);
  }

  editPost(): void {
    console.log('Edit post:', this.post.id);
    this.showDropdown = false;
  }

  deletePost(): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postDeleted.emit(this.post.id);
    }
    this.showDropdown = false;
  }

  sharePost(): void {
    console.log('Share post:', this.post.id);
  }

  // ==================== TRADUCCIÓN ====================
  
  toggleTranslation(): void {
    // Si ya está traducido, solo alternar vista
    if (this.translatedContent) {
      this.showTranslation = !this.showTranslation;
      return;
    }
    
    // Primera vez: llamar al backend
    this.isTranslating = true;
    
    console.log('🌐 Traduciendo post:', {
      postId: this.post.id,
      targetLanguage: this.userLanguage
    });
    
    this.postsService.translatePost(this.post.id, this.userLanguage)
      .subscribe({
        next: (response) => {
          console.log('✅ Traducción recibida:', response);
          this.translatedContent = response.translated_content;
          this.showTranslation = true;
          this.isTranslating = false;
        },
        error: (error) => {
          console.error('❌ Error:', error);
          alert('No se pudo traducir el contenido');
          this.isTranslating = false;
        }
      });
  }

  /**
   * Obtener bandera del idioma
   */
  getLanguageFlag(langCode: string): string {
    const flags: { [key: string]: string } = {
      'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪',
      'it': '🇮🇹', 'pt': '🇵🇹', 'ru': '🇷🇺', 'zh': '🇨🇳',
      'ja': '🇯🇵', 'ko': '🇰🇷', 'ar': '🇸🇦', 'hi': '🇮🇳',
      'nl': '🇳🇱', 'pl': '🇵🇱', 'tr': '🇹🇷'
    };
    return flags[langCode?.toLowerCase()] || '🌐';
  }

  /**
   * Obtener nombre del idioma
   */
  getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'en': 'English', 'es': 'Español', 'fr': 'Français', 'de': 'Deutsch',
      'it': 'Italiano', 'pt': 'Português', 'ru': 'Русский', 'zh': '中文',
      'ja': '日本語', 'ko': '한국어', 'ar': 'العربية', 'hi': 'हिन्दी',
      'nl': 'Nederlands', 'pl': 'Polski', 'tr': 'Türkçe'
    };
    return languages[code] || code.toUpperCase();
  }
}