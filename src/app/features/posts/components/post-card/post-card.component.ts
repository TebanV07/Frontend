import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, LikeButtonComponent, LikeCountComponent, ReportModalComponent, TranslateModule],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent implements OnChanges {
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

  // ── Overlay de imágenes (única modalidad) ────────────────
  // ✅ ELIMINADO: imageTranslations, showImageTranslation, translatingImageId (OCR)
  // ✅ MANTENIDO: overlay únicamente
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userLanguage'] && !changes['userLanguage'].firstChange) {
      // Limpiar overlays al cambiar idioma
      Object.values(this.imageOverlayUrls).forEach(url => URL.revokeObjectURL(url));
      this.imageOverlayUrls     = {};
      this.translatingOverlayId = null;
      this.translatedContent    = '';
      this.showTranslation      = false;
    }
  }

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
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('default-image.png') &&
        !img.src.includes('default-avatar.png')) {
      img.src = '/assets/default-image.png';
    }
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

  // ── Traducción ───────────────────────────────────────────

  toggleTranslation(): void {
    if (!this.post) return;

    // Desactivar: volver al original y limpiar overlays
    if (this.showTranslation) {
      Object.values(this.imageOverlayUrls).forEach(url => URL.revokeObjectURL(url));
      this.imageOverlayUrls = {};
      this.showTranslation = false;
      return;
    }

    // Activar con caché de texto
    if (this.translatedContent) {
      this.showTranslation = true;
      // Re-aplicar overlay a imágenes que no tengan aún
      this.post.images?.forEach(img => {
        if (!this.imageOverlayUrls[img.id]) {
          this.translateImageOverlay(img);
        }
      });
      return;
    }

    // Llamar al backend
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

    // ✅ Auto-aplicar overlay a TODAS las imágenes al traducir
    this.post.images?.forEach(img => this.translateImageOverlay(img));
  }

  // ✅ MANTENIDO: overlay sobre imagen (toggle)
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
