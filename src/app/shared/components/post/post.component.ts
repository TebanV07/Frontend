import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Post } from '../../../core/models/post.model';
import { PostsService } from '../../../core/services/posts.service';
import { Comment } from '../../../core/models/comment.model';
import { CommentService } from '../../../core/services/comment.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { FlagService } from '../../../core/services/flag.service';
import { TranslationService, ImageTranslationResponse } from '../../../core/services/translation.service';
import { Language, LanguageService } from '../../../core/services/language.service';

import { CommentListComponent } from '../../../features/posts/comments/comment-list/comment-list.component';
import { LikeButtonComponent } from '../../../features/posts/likes/likes-button/likes-button.component';
import { LikeCountComponent } from '../../../features/posts/likes/likes-count/likes-count.component';
import { ReportModalComponent } from '../report-modal/report-modal.component';

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
    LikeCountComponent,
    ReportModalComponent, TranslateModule],
})
export class PostComponent implements OnInit, OnChanges {
  @Input() post!: Post;
  @Input() currentUserId?: number;
  @Output() postDeleted = new EventEmitter<number>();

  showComments = false;
  comments: Comment[] = [];
  loadingComments = false;

  // ── Dropdown ──────────────────────────────────────────────
  showDropdown = false;

  // ── Delete ────────────────────────────────────────────────
  showDeleteConfirm = false;
  isDeleting = false;
  deleteError = '';

  // ── Report ────────────────────────────────────────────────
  showReportModal = false;

  // ── Traducción de TEXTO ───────────────────────────────────
  showTranslation = false;
  translatedContent = '';
  isTranslating = false;
  selectedTranslationLanguage = 'es';
  lastTranslatedLanguage = '';

  // ── Traducción de IMÁGENES ────────────────────────────────
  imageTranslations: { [imageId: number]: ImageTranslationResponse } = {};
  showImageTranslation: { [imageId: number]: boolean } = {};
  translatingImageId: number | null = null;
  imageOverlayUrls: { [imageId: number]: string } = {};
  translatingOverlayId: number | null = null;
  availableLanguages: Language[] = [];

  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private postsService: PostsService,
    private commentService: CommentService,
    public flagService: FlagService,
    private translationService: TranslationService,
    private languageService: LanguageService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUserId']) return; // ignorar cambios de userId
    // Limpiar overlays y traducciones de imágenes al cambiar cualquier input relevante
    this.imageOverlayUrls     = {};
    this.translatingOverlayId = null;
  }

  ngOnInit(): void {
    this.availableLanguages = this.languageService.SUPPORTED_LANGUAGES;

    if (!this.currentUserId) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        this.currentUserId = user?.id;
      }
    }

    const currentLanguage = this.languageService.getCurrentLanguage();
    if (this.availableLanguages.some(lang => lang.code === currentLanguage)) {
      this.selectedTranslationLanguage = currentLanguage;
    }
  }

  get isOwnPost(): boolean {
    if (!this.currentUserId || !this.post) return false;
    return this.currentUserId === (this.post.user_id ?? (this.post as any).user?.id);
  }

  // ==================== DROPDOWN ====================

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  // ==================== DELETE ====================

  openDeleteConfirm(): void {
    this.closeDropdown();
    this.deleteError = '';
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (this.isDeleting) return;
    this.isDeleting = true;
    this.deleteError = '';

    this.postsService.deletePost(this.post.id.toString()).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteConfirm = false;
        this.postDeleted.emit(this.post.id);
      },
      error: (err) => {
        this.isDeleting = false;
        this.deleteError = err.error?.detail || 'Error al eliminar el post.';
      }
    });
  }

  // ==================== REPORT ====================

  openReport(): void {
    this.closeDropdown();
    this.showReportModal = true;
  }

  onReportClosed(): void {
    this.showReportModal = false;
  }

  // ==================== TRADUCCIÓN ====================

  onTranslationLanguageChange(event: Event): void {
    const newLanguage = (event.target as HTMLSelectElement).value;
    this.selectedTranslationLanguage = newLanguage;
    // Limpiar siempre, aunque no esté mostrando traducción
    this.translatedContent      = '';
    this.lastTranslatedLanguage = '';
    this.showTranslation        = false;
    this.imageTranslations      = {};
    // Limpiar overlays — son específicos por idioma
    Object.values(this.imageOverlayUrls).forEach(url => URL.revokeObjectURL(url));
    this.imageOverlayUrls     = {};
    this.translatingOverlayId = null;
    // Solo re-traducir si ya estaba activa la traducción
    if (newLanguage !== this.lastTranslatedLanguage) {
      this.toggleTranslation();
    }
  }

  toggleTranslation(): void {
    if (this.showTranslation) {
      this.showTranslation = false;
      return;
    }

    if (this.translatedContent && this.lastTranslatedLanguage === this.selectedTranslationLanguage) {
      this.showTranslation = true;
      return;
    }

    this.isTranslating = true;

    this.postsService.translatePost(this.post.id, this.selectedTranslationLanguage).subscribe({
      next: (response) => {
        this.translatedContent = response?.translated_content || response?.content || '';
        this.lastTranslatedLanguage = this.selectedTranslationLanguage;
        this.showTranslation = true;
        this.isTranslating = false;
      },
      error: () => {
        this.simulateTranslation();
      }
    });

    if (this.post.images?.length) {
      this.post.images.forEach(image => {
        if (
          this.imageTranslations[image.id] &&
          this.imageTranslations[image.id].target_language === this.selectedTranslationLanguage
        ) {
          return;
        }

        this.translationService.translateImageFromUrl(
          image.id,
          image.image_url,
          this.selectedTranslationLanguage
        ).then(obs$ => {
          obs$.subscribe({
            next: (result) => {
              this.imageTranslations[image.id] = result;
            },
            error: (err) => console.error('Error traduciendo imagen:', err)
          });
        }).catch(err => console.error('Error descargando imagen:', err));
      });
    }
  }

  translateImageOverlay(image: { id: number; image_url: string }): void {
    if (this.translatingOverlayId === image.id) return;

    if (this.imageOverlayUrls[image.id]) {
      URL.revokeObjectURL(this.imageOverlayUrls[image.id]);
      delete this.imageOverlayUrls[image.id];
      return;
    }

    this.translatingOverlayId = image.id;

    this.translationService.translateImageWithOverlayFromUrl(
      image.id,
      image.image_url,
      this.selectedTranslationLanguage
    ).then((obs$: any) => {
      obs$.subscribe({
        next: (blob: Blob) => {
          this.imageOverlayUrls[image.id] = URL.createObjectURL(blob);
          this.translatingOverlayId = null;
        },
        error: (err: unknown) => {
          console.error('Error con overlay:', err);
          this.translatingOverlayId = null;
        }
      });
    }).catch((err: unknown) => {
      console.error('Error descargando imagen para overlay:', err);
      this.translatingOverlayId = null;
    });
  }

  private simulateTranslation(): void {
    setTimeout(() => {
      this.translatedContent = `[AI Translated to ${this.flagService.getLanguageName(this.selectedTranslationLanguage)}]\n\n${this.post.content}`;
      this.lastTranslatedLanguage = this.selectedTranslationLanguage;
      this.showTranslation = true;
      this.isTranslating = false;
    }, 1000);
  }

  // ==================== URLS ====================

  getFullImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    return imageUrl.startsWith('http') ? imageUrl : `${this.apiBaseUrl}${imageUrl}`;
  }

  getFullVideoUrl(videoUrl: string): string {
    if (!videoUrl) return '';
    return videoUrl.startsWith('http') ? videoUrl : `${this.apiBaseUrl}${videoUrl}`;
  }

  getUserAvatarUrl(): string {
    const user = this.post?.user as any;
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

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('default-image.png') &&
        !img.src.includes('default-avatar.png')) {
      img.src = '/assets/default-image.png';
    }
  }

  onVideoError(event: Event): void {
    console.error('Error loading video');
  }

  // ==================== COMENTARIOS ====================

  toggleComments(): void {
    if (!this.post?.id) return;
    this.showComments = !this.showComments;
  }

  onCommentCreated(comment: Comment): void {
    this.post.comments_count++;
  }

  // ==================== LIKES ====================

  onLikeToggled(event: { isLiked: boolean; likesCount: number }): void {
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
    return `${Math.floor(diffHours / 24)}d`;
  }
}
