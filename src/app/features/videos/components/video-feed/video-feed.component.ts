import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ViewChildren, QueryList, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { VideoService, Video } from '../../../../core/services/video.service';
import { FlagService } from '../../../../core/services/flag.service';
import { LanguageService } from '../../../../core/services/language.service';
import { CommentListComponent } from '../../../posts/comments/comment-list/comment-list.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-video-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, CommentListComponent, HeaderComponent, TranslateModule],
  templateUrl: './video-feed.component.html',
  styleUrls: ['./video-feed.component.scss']
})
export class VideoFeedComponent implements OnInit, AfterViewInit, OnDestroy {

  videos: Video[] = [];
  currentVideoIndex = 0;
  isPlaying = false;
  isMuted = false;
  isLoading = true;
  currentSubtitleUrl?: string;

  showComments = false;

  // Traducci�n
  showLanguageMenu = false;
  availableLanguages: string[] = [];
  currentLanguage = 'es';
  isTranslating = false;
  translationJobId?: number;
  translationProgress = 0;
  includeAudioDubbing = false;
  showDubbingOption = false;
  ttsProvider: 'openai' | 'elevenlabs' = 'openai';
  cloneVoice = false;
  currentDubbedVideoUrl: string | null = null;

  currentUserId: number = 1;

  private observer?: IntersectionObserver;
  private routeSubscription?: Subscription;
  private requestedVideoRef: string | null = null;
  private isResolvingRequestedVideo = false;

  @ViewChildren('videoElem') videoElems!: QueryList<ElementRef<HTMLVideoElement>>;

  constructor(
    private videoService: VideoService,
    public flagService: FlagService,
    private languageService: LanguageService,
    private route: ActivatedRoute
  ) {
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(paramMap => {
      this.requestedVideoRef = paramMap.get('id');
      if (this.videos.length > 0) {
        this.focusRequestedVideo();
      }
    });

    this.loadVideos();
  }

  ngAfterViewInit(): void {
    this.setupObserver();
    this.videoElems.changes.subscribe(() => this.setupObserver());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.routeSubscription?.unsubscribe();
    this.videoElems?.forEach(el => {
      el.nativeElement.pause();
      el.nativeElement.src = '';
    });
  }

  // ==================== CARGA ====================

  loadVideos(): void {
    this.isLoading = true;
    this.videoService.getVideos(1, 50).subscribe({
      next: vids => {
        this.videos = vids;
        this.isLoading = false;
        if (vids.length > 0) {
          this.currentLanguage = vids[0].original_language || this.languageService.getCurrentLanguage();
        }
        this.focusRequestedVideo();
      },
      error: err => {
        console.error('Error loading videos', err);
        this.isLoading = false;
      }
    });
  }

  private focusRequestedVideo(): void {
    const videoRef = this.requestedVideoRef?.trim();

    if (!videoRef || this.videos.length === 0) {
      return;
    }

    const targetIndex = this.findVideoIndex(videoRef);
    if (targetIndex >= 0) {
      this.scrollToVideo(targetIndex);
      return;
    }

    if (this.isResolvingRequestedVideo) {
      return;
    }

    this.resolveRequestedVideo(videoRef);
  }

  private findVideoIndex(videoRef: string): number {
    const numericId = this.isNumericVideoId(videoRef) ? Number(videoRef) : null;

    return this.videos.findIndex(video => (
      video.uuid === videoRef ||
      (numericId !== null && video.id === numericId)
    ));
  }

  private resolveRequestedVideo(videoRef: string): void {
    this.isResolvingRequestedVideo = true;

    const request$ = this.isNumericVideoId(videoRef)
      ? this.videoService.getVideo(Number(videoRef))
      : this.videoService.getVideoByUuid(videoRef);

    request$.subscribe({
      next: (video) => {
        const existingIndex = this.videos.findIndex(item => item.id === video.id || item.uuid === video.uuid);

        if (existingIndex >= 0) {
          this.scrollToVideo(existingIndex);
        } else {
          this.videos = [video, ...this.videos];
          this.scrollToVideo(0);
        }

        this.isResolvingRequestedVideo = false;
      },
      error: (error) => {
        console.error('Error resolving requested video:', error);
        this.isResolvingRequestedVideo = false;
      }
    });
  }

  private scrollToVideo(index: number): void {
    if (index < 0 || index >= this.videos.length) {
      return;
    }

    this.currentVideoIndex = index;

    setTimeout(() => {
      const targetVideoEl = this.videoElems?.toArray()[index]?.nativeElement;
      targetVideoEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private isNumericVideoId(value: string): boolean {
    return /^\d+$/.test(value);
  }

  // ==================== INTERSECTION OBSERVER ====================

  private setupObserver(): void {
    this.observer?.disconnect();

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        const index = Number(video.dataset['index']);

        if (entry.intersectionRatio >= 0.75) {
          this.videoElems.forEach(el => {
            if (el.nativeElement !== video) {
              el.nativeElement.pause();
              el.nativeElement.currentTime = 0;
            }
          });

          this.currentVideoIndex = index;
          this.showComments = false;

          const currentVideo = this.videos[index];
          if (currentVideo) {
            this.currentLanguage = currentVideo.original_language || 'es';
            this.showLanguageMenu = false;
            this.currentSubtitleUrl = undefined;
          }

          video.muted = this.isMuted;
          video.volume = 1.0;
          video.play()
            .then(() => this.isPlaying = true)
            .catch(() => {
              // Autoplay bloqueado por el navegador: intentar muteado.
              video.muted = true;
              video.play()
                .then(() => { this.isPlaying = true; })
                .catch(() => { this.isPlaying = false; });
            });

        } else {
          if (index === this.currentVideoIndex) {
            video.pause();
            this.isPlaying = false;
          }
        }
      });
    }, { threshold: 0.75 });

    this.videoElems.forEach(el => this.observer!.observe(el.nativeElement));
  }

  // ==================== CONTROL DE VIDEO ====================

  togglePlay(video: HTMLVideoElement): void {
    if (video.paused) {
      video.play().catch(() => {});
      this.isPlaying = true;
    } else {
      video.pause();
      this.isPlaying = false;
    }
  }

  toggleMute(video: HTMLVideoElement): void {
    this.isMuted = !this.isMuted;
    this.videoElems.forEach(el => {
      el.nativeElement.muted = this.isMuted;
    });
    if (!this.isMuted) {
      video.volume = 1.0;
    }
  }

  // El observer controla la reproducci�n autom�tica del video activo.
  onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.volume = 1.0;
    video.muted = this.isMuted;
    // Solo reproducir si es el video activo
    const index = Number(video.dataset['index']);
    if (index === this.currentVideoIndex) {
      video.play().catch(() => {});
    }
  }

  onVideoError(event: Event): void {
    console.error('Error cargando video');
  }

  // ==================== COMENTARIOS ====================

  toggleComments(): void {
    this.showComments = !this.showComments;
  }

  // ==================== ACCIONES ====================

  toggleLike(video: Video): void {
    this.videoService.toggleLike(video.id).subscribe({
      next: (res) => {
        video.is_liked = res.is_liked;
        video.likes_count = res.likes_count;
      },
      error: err => console.error('Error like:', err)
    });
  }

  toggleBookmark(video: Video): void {
    this.videoService.toggleBookmark(video.id).subscribe({
      next: (res) => { video.is_saved = res.is_saved; },
      error: err => console.error('Error bookmark:', err)
    });
  }

  shareVideo(video: Video): void {
    this.videoService.shareVideo(video.id).subscribe({
      next: (res) => {
        video.shares_count = res.shares_count;
        const shareUrl = `${window.location.origin}/videos/${video.uuid}`;
        navigator.clipboard.writeText(shareUrl)
          .then(() => alert('�Enlace copiado!'))
          .catch(() => alert(`Enlace: ${shareUrl}`));
      },
      error: err => console.error('Error share:', err)
    });
  }

  followUser(user: any): void {
    console.log('Follow user:', user?.username);
  }

  // ==================== TRADUCCI�N ====================

  get currentVideo(): Video | null {
    return this.videos[this.currentVideoIndex] || null;
  }

  loadAvailableLanguages(video: Video): void {
    const languageCandidates = video.available_languages?.length
      ? [video.original_language || this.languageService.getCurrentLanguage(), ...video.available_languages]
      : [video.original_language || this.languageService.getCurrentLanguage(), ...this.languageService.SUPPORTED_LANGUAGES.map(lang => lang.code)];

    this.availableLanguages = this.buildUniqueLanguages(languageCandidates);
  }

  toggleTranslation(): void {
    this.showLanguageMenu = !this.showLanguageMenu;
    if (this.showLanguageMenu && this.currentVideo) {
      this.loadAvailableLanguages(this.currentVideo);
    }
  }

  requestTranslation(targetLanguage: string): void {
    const video = this.currentVideo;
    if (!video) return;

    this.includeAudioDubbing = false;
    this.ttsProvider = 'openai';
    this.cloneVoice = false;

    if (this.getComparableLanguageCode(targetLanguage) === this.getComparableLanguageCode(video.original_language)) {
      this.currentLanguage = targetLanguage;
      this.showLanguageMenu = false;
      alert('Este es el idioma original del video');
      return;
    }

    if (video.available_languages?.some(language => this.getComparableLanguageCode(language) === this.getComparableLanguageCode(targetLanguage))) {
      this.switchToLanguage(targetLanguage);
      return;
    }

    const wantAudio = confirm('�Deseas incluir doblaje de audio?');

    if (!wantAudio) {
      this.isTranslating = true;
      this.translationProgress = 0;
      this.videoService.requestVideoTranslation(
        video.id, [targetLanguage], false, 'vtt', 'openai', false, false
      ).subscribe({
        next: (res) => this.handleTranslationResponse(res, video, targetLanguage),
        error: (err) => this.handleTranslationError(err)
      });
      return;
    }

    this.includeAudioDubbing = true;
    const wantPremium = confirm('�Usar voz premium (ElevenLabs)?');

    if (wantPremium) {
      this.ttsProvider = 'elevenlabs';
      this.cloneVoice = confirm('�Quieres clonar la voz del video original?');
    } else {
      this.ttsProvider = 'openai';
      this.cloneVoice = false;
    }

    this.isTranslating = true;
    this.translationProgress = 0;
    this.videoService.requestVideoTranslation(
      video.id, [targetLanguage], true, 'vtt',
      this.ttsProvider, this.cloneVoice, true
    ).subscribe({
      next: (res) => this.handleTranslationResponse(res, video, targetLanguage),
      error: (err) => this.handleTranslationError(err)
    });
  }

  switchToLanguage(language: string): void {
    const video = this.currentVideo;
    if (!video) return;

    const activeVideoEl = this.videoElems.toArray()[this.currentVideoIndex]?.nativeElement;
    if (!activeVideoEl) return;

    this.currentLanguage = language;
    this.showLanguageMenu = false;
    this.showDubbingOption = false;

    this.videoService.getDubbedVideo(video.id, language).subscribe({
      next: (dubbed) => {
        const wasPlaying = !activeVideoEl.paused;
        const currentTime = activeVideoEl.currentTime;
        activeVideoEl.pause();
        activeVideoEl.src = this.getFullUrl(dubbed.translated_video_url);
        activeVideoEl.load();
        activeVideoEl.onloadedmetadata = () => {
          activeVideoEl.currentTime = currentTime;
          activeVideoEl.muted = false;
          activeVideoEl.volume = 1.0;
          if (wasPlaying) activeVideoEl.play();
        };
        alert(`Reproduciendo doblaje en ${this.getLanguageName(language)}`);
      },
      error: () => {
        this.videoService.getSubtitles(video.id, language).subscribe({
          next: (subtitles) => {
            if (subtitles.subtitle_url) {
              this.currentSubtitleUrl = this.getFullUrl(subtitles.subtitle_url);
              setTimeout(() => activeVideoEl.load(), 100);
            }
            alert(`Subt�tulos en ${this.getLanguageName(language)}`);
          },
          error: () => alert('No hay doblaje ni subt�tulos disponibles')
        });
      }
    });
  }

  private pollTranslationStatus(videoId: number, jobId: number, targetLanguage: string): void {
    let pollCount = 0;
    const maxPolls = 200;

    const interval = setInterval(() => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(interval);
        this.isTranslating = false;
        alert('Tiempo de espera agotado.');
        return;
      }

      this.videoService.getTranslationStatus(videoId, jobId).subscribe({
        next: (job) => {
          this.translationProgress = job.progress;
          if (job.status === 'completed') {
            clearInterval(interval);
            this.isTranslating = false;
            alert('�Traducci�n completada!');
            if (this.currentVideo) {
              const langs = job.completed_languages?.length
                ? job.completed_languages
                : [targetLanguage];
              this.currentVideo.available_languages = [
                ...new Set([...(this.currentVideo.available_languages || []), ...langs])
              ];
            }
            this.switchToLanguage(targetLanguage);
          } else if (job.status === 'failed') {
            clearInterval(interval);
            this.isTranslating = false;
            alert(`Error: ${job.error_message || 'Traducci�n fallida'}`);
          }
        },
        error: () => {
          clearInterval(interval);
          this.isTranslating = false;
        }
      });
    }, 3000);
  }

  private handleTranslationResponse(response: any, video: Video, targetLanguage: string): void {
    this.translationJobId = response.job_id;
    alert(`Traducci�n iniciada. Tiempo estimado: ${response.estimated_time_minutes} min`);
    this.pollTranslationStatus(video.id, response.job_id, targetLanguage);
  }

  private handleTranslationError(error: any): void {
    this.isTranslating = false;
    this.showDubbingOption = false;
    const msg = error.error?.detail || 'Error al solicitar traducci�n.';
    alert(msg);
  }

  // ==================== HELPERS ====================

  getFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiBaseUrl}${url}`;
  }

  formatNumber(num: number): string {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getUserAvatar(video: Video): string {
    return video.user?.avatar || 'assets/default-avatar.png';
  }

  getUserName(video: Video): string {
    const u = video.user;
    if (!u) return 'Usuario';
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return full || u.username || 'Usuario';
  }

  getVideoUrl(video: Video): string {
    return this.getFullUrl(video.video_url);
  }

  getVideoThumbnail(video: Video): string {
    return video.thumbnail_url ? this.getFullUrl(video.thumbnail_url) : '';
  }

  getLanguageFlag(lang: string): string {
    const comparableCode = this.getComparableLanguageCode(lang);
    return this.languageService.SUPPORTED_LANGUAGES.find(language => language.code === comparableCode)?.flag || '??';
  }

  getLanguageName(lang: string): string {
    const comparableCode = this.getComparableLanguageCode(lang);
    const knownLanguage = this.languageService.SUPPORTED_LANGUAGES.find(language => language.code === comparableCode);
    return knownLanguage?.nativeName || this.flagService.getLanguageName(comparableCode) || lang.toUpperCase();
  }

  private buildUniqueLanguages(languages: string[]): string[] {
    const uniqueLanguages = new Map<string, string>();

    languages
      .filter((language): language is string => !!language)
      .forEach(language => {
        const comparableCode = this.getComparableLanguageCode(language);
        if (!uniqueLanguages.has(comparableCode)) {
          uniqueLanguages.set(comparableCode, language);
        }
      });

    return Array.from(uniqueLanguages.values());
  }

  private getComparableLanguageCode(lang: string | null | undefined): string {
    if (!lang) return '';

    const normalized = lang.toLowerCase();
    if (normalized === 'zh-cn') {
      return 'zh';
    }

    return normalized.split('-')[0];
  }
}


