import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Post } from '../../../../core/models/post.model';
import { PostsService } from '../../../../core/services/posts.service';
import { LikeButtonComponent } from '../../likes/likes-button/likes-button.component';
import { LikeCountComponent } from '../../likes/likes-count/likes-count.component';
import { environment } from '../../../../../environments/environment';
import { FlagService } from '../../../../core/services/flag.service';
import { ReportModalComponent } from '../../../../shared/components/report-modal/report-modal.component';
import { TranslationService, ImageTranslationResponse } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, LikeButtonComponent, LikeCountComponent, ReportModalComponent, TranslateModule],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent {
  @Input() post!: Post;
  @Input() currentUserId?: number;
  @Input() userLanguage = 'en';
  @Output() postDeleted  = new EventEmitter<number>();
  @Output() postUpdated  = new EventEmitter<Post>();
  @Output() saveToggled  = new EventEmitter<number>();
  @Output() translatePost  = new EventEmitter<number>();
  @Output() translateVideo = new EventEmitter<number>();

  showDropdown = false;
  isPlaying    = false;

  // ── Traducción de TEXTO ──────────────────────────────────
  showTranslation   = false;
  translatedContent = '';
  isTranslating     = false;

  // ── Traducción de IMÁGENES ───────────────────────────────
  imageTranslations:    { [imageId: number]: ImageTranslationResponse } = {};
  showImageTranslation: { [imageId: number]: boolean }                  = {};
  translatingImageId:   number | null = null;
  // ── Overlay de imágenes ──────────────────────────────────
  imageOverlayUrls: { [imageId: number]: string } = {};
  translatingOverlayId: number | null = null;

  // ── Report / Delete ──────────────────────────────────────
  showReportModal   = false;
  showDeleteConfirm = false;
  isDeleting        = false;
  deleteError       = '';

  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(
    public  flagService:        FlagService,
    private postsService:       PostsService,
    private translationService: TranslationService
  ) {}

  get isOwnPost(): boolean {
    return this.currentUserId === this.post.user_id;
  }

  get formattedDate(): string {
    const date    = new Date(this.post.created_at as string);
    const now     = new Date();
    const diffMs  = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1)  return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7)  return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // ── URL helpers ──────────────────────────────────────────

  getFullImageUrl(imageUrl: string | undefined | null): string {
    if (!imageUrl) return '';
    return imageUrl.startsWith('http') ? imageUrl : `${this.apiBaseUrl}${imageUrl}`;
  }

  getFullVideoUrl(videoUrl: string | undefined | null): string {
    if (!videoUrl) return '';
    return videoUrl.startsWith('http') ? videoUrl : `${this.apiBaseUrl}${videoUrl}`;
  }

  getThumbnail(): string {
    const candidates = [
      (this.post as any).thumbnail_url,
      (this.post as any).thumbnailUrl,
      (this.post as any).image_url,
      (this.post as any).images?.[0]?.image_url,
      (this.post as any).video?.thumbnail_url
    ];
    const found = candidates.find((c: any) => !!c) as string | undefined;
    return this.getFullImageUrl(found || '');
  }

  // ── Video ────────────────────────────────────────────────

  playInline(event?: Event): void {
    if (event) event.stopPropagation();
    this.isPlaying = true;
    setTimeout(() => {
      const videoEl = document.querySelector<HTMLVideoElement>(`#video-player-${this.post.id}`);
      if (videoEl) videoEl.play().catch(() => {});
    }, 50);
  }

  stopInline(event?: Event): void {
    if (event) event.stopPropagation();
    this.isPlaying = false;
    const videoEl = document.querySelector<HTMLVideoElement>(`#video-player-${this.post.id}`);
    if (videoEl) { videoEl.pause(); videoEl.currentTime = 0; }
  }

  onVideoError(_event: Event): void { this.isPlaying = false; }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/default-image.png';
  }

  // ── Dropdown ─────────────────────────────────────────────

  toggleDropdown(): void  { this.showDropdown = !this.showDropdown; }
  closeDropdown(): void   { this.showDropdown = false; }

  editPost(): void {
    this.closeDropdown();
    this.postUpdated.emit(this.post);
  }

  // ── Delete ───────────────────────────────────────────────

  openDeleteConfirm(): void {
    this.closeDropdown();
    this.showDeleteConfirm = true;
    this.deleteError = '';
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (this.isDeleting) return;
    this.isDeleting  = true;
    this.deleteError = '';

    this.postsService.deletePost(this.post.id.toString()).subscribe({
      next: () => {
        this.isDeleting        = false;
        this.showDeleteConfirm = false;
        this.postDeleted.emit(this.post.id);
      },
      error: (err) => {
        this.isDeleting  = false;
        this.deleteError = err.error?.detail || 'Error al eliminar el post.';
      }
    });
  }

  // ── Report ───────────────────────────────────────────────

  openReport(): void {
    this.closeDropdown();
    this.showReportModal = true;
  }

  onReportClosed(): void { this.showReportModal = false; }

  // ── Traducción de TEXTO ──────────────────────────────────

  toggleTranslation(): void {
    if (!this.post) return;
    if (this.showTranslation) { this.showTranslation = false; return; }
    if (this.translatedContent) { this.showTranslation = true; return; }

    this.isTranslating = true;
    this.translatePost.emit(this.post.id);

    this.postsService.translatePost(this.post.id, this.userLanguage).subscribe({
      next: (res: any) => {
        this.translatedContent = res?.translated_content ?? res?.content ?? '';
        this.showTranslation   = true;
        this.isTranslating     = false;
      },
      error: () => {
        this.translatedContent = `[Simulated translation] ${this.post.content}`;
        this.showTranslation   = true;
        this.isTranslating     = false;
      }
    });
  }

  // ── Traducción de IMÁGENES ───────────────────────────────

  translateImage(image: { id: number; image_url: string }): void {
    if (this.translatingImageId === image.id) return;
    this.translatingImageId = image.id;

    this.translationService.translateImageFromUrl(
      image.id,
      image.image_url,
      this.userLanguage
    ).then(obs$ => {
      obs$.subscribe({
        next: (result) => {
          this.imageTranslations[image.id]    = result;
          this.showImageTranslation[image.id] = true;
          this.translatingImageId             = null;
        },
        error: (err) => {
          console.error('Error traduciendo imagen:', err);
          this.translatingImageId = null;
        }
      });
    }).catch(err => {
      console.error('Error descargando imagen:', err);
      this.translatingImageId = null;
    });
  }

  toggleImageTranslation(imageId: number): void {
    this.showImageTranslation[imageId] = !this.showImageTranslation[imageId];
  }

  translateImageOverlay(image: { id: number; image_url: string }): void {
  if (this.translatingOverlayId === image.id) return;

  // Si ya tenemos el overlay, alternamos visibilidad usando el mismo toggle
  if (this.imageOverlayUrls[image.id]) {
    // Limpiar overlay para volver a la imagen original
    URL.revokeObjectURL(this.imageOverlayUrls[image.id]);
    delete this.imageOverlayUrls[image.id];
    return;
  }

  this.translatingOverlayId = image.id;

  this.translationService.translateImageWithOverlayFromUrl(
    image.id,
    image.image_url,
    this.userLanguage
  ).then(obs$ => {
    obs$.subscribe({
      next: (blob) => {
        this.imageOverlayUrls[image.id] = URL.createObjectURL(blob);
        this.translatingOverlayId = null;
      },
      error: (err) => {
        console.error('Error con overlay:', err);
        this.translatingOverlayId = null;
      }
    });
  }).catch(err => {
    console.error('Error descargando imagen para overlay:', err);
    this.translatingOverlayId = null;
  });
}
  // ── Acciones generales ───────────────────────────────────

  sharePost(): void { console.log('Share post:', this.post.id); }

  onLikeToggled(event: { isLiked: boolean; likesCount: number }): void {
    this.post.is_liked    = event.isLiked;
    this.post.likes_count = event.likesCount;
  }

  onSavePost(): void { this.saveToggled.emit(this.post.id); }

  requestTranslateVideo(): void { this.translateVideo.emit(this.post.id); }
}


