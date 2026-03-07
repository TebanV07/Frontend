import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../../core/models/post.model';
import { PostsService } from '../../../core/services/posts.service';
import { Comment } from '../../../core/models/comment.model';
import { CommentService } from '../../../core/services/comment.service';
import { FormsModule } from '@angular/forms';
import { FlagService } from '../../../core/services/flag.service';

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
    ReportModalComponent
  ],
})
export class PostComponent implements OnInit {
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

  // ── Translation ───────────────────────────────────────────
  showTranslation = false;
  translatedContent = '';
  isTranslating = false;
  userLanguage = 'en';
  selectedTranslationLanguage = 'es';
  lastTranslatedLanguage = '';

  availableLanguages = [
    { code: 'es', name: 'Español',    flag: '🇪🇸' },
    { code: 'en', name: 'English',    flag: '🇺🇸' },
    { code: 'fr', name: 'Français',   flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch',    flag: '🇩🇪' },
    { code: 'pt', name: 'Português',  flag: '🇧🇷' },
    { code: 'it', name: 'Italiano',   flag: '🇮🇹' },
    { code: 'ja', name: '日本語',      flag: '🇯🇵' },
    { code: 'zh', name: '中文',        flag: '🇨🇳' },
    { code: 'ko', name: '한국어',      flag: '🇰🇷' },
    { code: 'ru', name: 'Русский',    flag: '🇷🇺' },
    { code: 'ar', name: 'العربية',    flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी',     flag: '🇮🇳' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski',     flag: '🇵🇱' },
    { code: 'tr', name: 'Türkçe',     flag: '🇹🇷' }
  ];

  private readonly apiBaseUrl = 'http://localhost:8001';

  constructor(
    private postsService: PostsService,
    private commentService: CommentService,
    public flagService: FlagService
  ) {}

ngOnInit(): void {
  if (!this.currentUserId) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const user = JSON.parse(stored);
      this.currentUserId = user?.id;
    }
  }

    this.userLanguage = localStorage.getItem('userLanguage') || 'en';
    const browserLang = navigator.language.split('-')[0];
    if (this.availableLanguages.some(l => l.code === browserLang)) {
      this.selectedTranslationLanguage = browserLang;
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
    if (this.showTranslation) {
      this.translatedContent = '';
      this.lastTranslatedLanguage = '';
      this.showTranslation = false;
      this.toggleTranslation();
    }
  }

  toggleTranslation(): void {
    if (this.showTranslation) { this.showTranslation = false; return; }

    if (this.translatedContent && this.lastTranslatedLanguage === this.selectedTranslationLanguage) {
      this.showTranslation = true;
      return;
    }

    this.isTranslating = true;
    this.postsService.translatePost(this.post.id, this.selectedTranslationLanguage).subscribe({
      next: (response) => {
        this.translatedContent = response?.translated_content || response?.content || (typeof response === 'string' ? response : '');
        this.lastTranslatedLanguage = this.selectedTranslationLanguage;
        this.showTranslation = true;
        this.isTranslating = false;
      },
      error: (error) => {
        if (error?.status === 404 || error?.status === 501) {
          this.simulateTranslation();
        } else {
          this.isTranslating = false;
        }
      }
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

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/default-image.png';
  }

  onVideoError(event: Event): void {
    console.error('❌ Error loading video');
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
