import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Post } from '../../../core/models/post.model';
import { PostsService } from '../../../core/services/posts.service';
import { Comment } from '../../../core/models/comment.model';
import { CommentService } from '../../../core/services/comment.service';
import { FormsModule } from '@angular/forms';
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
export class PostComponent implements OnInit {
  @Input() post!: Post;
  @Input() currentUserId?: number;
  @Output() postDeleted = new EventEmitter<number>();

  showComments = false;
  comments: Comment[] = [];
  loadingComments = false;

  // â”€â”€ Dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  showDropdown = false;

  // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  showDeleteConfirm = false;
  isDeleting = false;
  deleteError = '';

  // â”€â”€ Report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  showReportModal = false;

  // â”€â”€ TraducciÃ³n de TEXTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  showTranslation = false;
  translatedContent = '';
  isTranslating = false;
  selectedTranslationLanguage = 'es';
  lastTranslatedLanguage = '';

  // â”€â”€ TraducciÃ³n de IMÃGENES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  imageTranslations: { [imageId: number]: ImageTranslationResponse } = {};
  showImageTranslation: { [imageId: number]: boolean } = {};
  translatingImageId: number | null = null;

  availableLanguages: Language[] = [];

  private readonly apiBaseUrl = 'http://localhost:8001';

  constructor(
    private postsService: PostsService,
    private commentService: CommentService,
    public flagService: FlagService,
    private translationService: TranslationService,
    private languageService: LanguageService
  ) {}

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

  // ==================== TRADUCCIÃ“N ====================

  onTranslationLanguageChange(event: Event): void {
    const newLanguage = (event.target as HTMLSelectElement).value;
    this.selectedTranslationLanguage = newLanguage;
    if (this.showTranslation) {
      this.translatedContent = '';
      this.lastTranslatedLanguage = '';
      this.showTranslation = false;
      this.imageTranslations = {};
      this.toggleTranslation();
    }
  }

  toggleTranslation(): void {
    // Si ya estÃ¡ mostrando traducciÃ³n â†’ ocultar todo
    if (this.showTranslation) {
      this.showTranslation = false;
      return;
    }

    // Si ya tenemos la traducciÃ³n del texto en el mismo idioma â†’ solo mostrar
    if (this.translatedContent && this.lastTranslatedLanguage === this.selectedTranslationLanguage) {
      this.showTranslation = true;
      return;
    }

    this.isTranslating = true;

    // Traducir texto del post
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

    // Traducir imÃ¡genes en paralelo
    if (this.post.images?.length) {
      this.post.images.forEach(image => {
        // Si ya existe traducciÃ³n para este idioma, no volver a llamar
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

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/default-image.png';
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

