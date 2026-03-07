import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ViewChildren, QueryList, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VideoService, Video } from '../../../../core/services/video.service';
import { FlagService } from '../../../../core/services/flag.service';
import { CommentListComponent } from '../../../posts/comments/comment-list/comment-list.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-video-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, CommentListComponent, HeaderComponent],
  templateUrl: './video-feed.component.html',
  styleUrls: ['./video-feed.component.scss']
})
export class VideoFeedComponent implements OnInit, AfterViewInit, OnDestroy {

  videos: Video[] = [];
  currentVideoIndex = 0;
  isPlaying = false;
  isMuted = false;           // ✅ Empieza sin mute para que el audio funcione
  isLoading = true;
  currentSubtitleUrl?: string;

  // ✅ Control de comentarios
  showComments = false;

  // Traducción
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

  @ViewChildren('videoElem') videoElems!: QueryList<ElementRef<HTMLVideoElement>>;

  constructor(
    private videoService: VideoService,
    public flagService: FlagService
  ) {}

  ngOnInit(): void {
    this.loadVideos();
  }

  ngAfterViewInit(): void {
    this.setupObserver();
    this.videoElems.changes.subscribe(() => this.setupObserver());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    // ✅ Pausar todos los videos al destruir el componente
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
          this.currentLanguage = vids[0].original_language || 'es';
        }
      },
      error: err => {
        console.error('Error loading videos', err);
        this.isLoading = false;
      }
    });
  }

  // ==================== INTERSECTION OBSERVER ====================

  private setupObserver(): void {
    this.observer?.disconnect();

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        const index = Number(video.dataset['index']);

        if (entry.intersectionRatio >= 0.75) {
          // ✅ Pausar TODOS los videos primero
          this.videoElems.forEach(el => {
            if (el.nativeElement !== video) {
              el.nativeElement.pause();
              el.nativeElement.currentTime = 0;
            }
          });

          this.currentVideoIndex = index;
          this.showComments = false;  // ✅ Cerrar comentarios al cambiar video

          const currentVideo = this.videos[index];
          if (currentVideo) {
            this.currentLanguage = currentVideo.original_language || 'es';
            this.showLanguageMenu = false;
            this.currentSubtitleUrl = undefined;
          }

          // ✅ Aplicar estado de mute del componente al video
          video.muted = this.isMuted;
          video.volume = 1.0;
          video.play()
            .then(() => this.isPlaying = true)
            .catch(() => {
              // Autoplay bloqueado por el navegador → intentar muteado
              video.muted = true;
              video.play()
                .then(() => { this.isPlaying = true; })
                .catch(() => { this.isPlaying = false; });
            });

        } else {
          // ✅ Solo pausar si este video estaba activo
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
    // ✅ Aplicar a TODOS los videos para consistencia
    this.videoElems.forEach(el => {
      el.nativeElement.muted = this.isMuted;
    });
    if (!this.isMuted) {
      video.volume = 1.0;
    }
  }

  // ✅ onVideoLoaded ya NO llama play() — el observer se encarga
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
          .then(() => alert('¡Enlace copiado!'))
          .catch(() => alert(`Enlace: ${shareUrl}`));
      },
      error: err => console.error('Error share:', err)
    });
  }

  followUser(user: any): void {
    console.log('Follow user:', user?.username);
  }

  // ==================== TRADUCCIÓN ====================

  get currentVideo(): Video | null {
    return this.videos[this.currentVideoIndex] || null;
  }

  loadAvailableLanguages(video: Video): void {
    if (video.available_languages && video.available_languages.length > 0) {
      this.availableLanguages = video.available_languages;
    } else {
      this.availableLanguages = [
        video.original_language || 'es',
        'es', 'en', 'fr', 'de', 'pt', 'it', 'ru', 'zh-cn', 'ja', 'ko'
      ];
      this.availableLanguages = [...new Set(this.availableLanguages)];
    }
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

    if (targetLanguage === video.original_language) {
      this.currentLanguage = targetLanguage;
      this.showLanguageMenu = false;
      alert('Este es el idioma original del video');
      return;
    }

    if (video.available_languages?.includes(targetLanguage)) {
      this.switchToLanguage(targetLanguage);
      return;
    }

    const wantAudio = confirm('¿Deseas incluir doblaje de audio?');

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
    const wantPremium = confirm('¿Usar voz premium (ElevenLabs)?');

    if (wantPremium) {
      this.ttsProvider = 'elevenlabs';
      this.cloneVoice = confirm('¿Quieres CLONAR la voz del video original?');
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
        activeVideoEl.src = dubbed.translated_video_url;
        activeVideoEl.load();
        activeVideoEl.onloadedmetadata = () => {
          activeVideoEl.currentTime = currentTime;
          activeVideoEl.muted = false;
          activeVideoEl.volume = 1.0;
          if (wasPlaying) activeVideoEl.play();
        };
        alert(`🎙️ Reproduciendo doblaje en ${this.getLanguageName(language)}`);
      },
      error: () => {
        this.videoService.getSubtitles(video.id, language).subscribe({
          next: (subtitles) => {
            if (subtitles.subtitle_url) {
              this.currentSubtitleUrl = subtitles.subtitle_url;
              setTimeout(() => activeVideoEl.load(), 100);
            }
            alert(`📝 Subtítulos en ${this.getLanguageName(language)}`);
          },
          error: () => alert('No hay doblaje ni subtítulos disponibles')
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
            alert('¡Traducción completada!');
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
            alert(`Error: ${job.error_message || 'Traducción fallida'}`);
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
    alert(`Traducción iniciada. Tiempo estimado: ${response.estimated_time_minutes} min`);
    this.pollTranslationStatus(video.id, response.job_id, targetLanguage);
  }

  private handleTranslationError(error: any): void {
    this.isTranslating = false;
    this.showDubbingOption = false;
    const msg = error.error?.detail || 'Error al solicitar traducción.';
    alert(msg);
  }

  // ==================== HELPERS ====================

  getFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8001${url}`;
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
    const flags: { [key: string]: string } = {
      'es': '🇪🇸', 'en': '🇬🇧', 'fr': '🇫🇷', 'de': '🇩🇪',
      'pt': '🇵🇹', 'it': '🇮🇹', 'ru': '🇷🇺', 'zh-cn': '🇨🇳',
      'ja': '🇯🇵', 'ko': '🇰🇷', 'ar': '🇸🇦', 'hi': '🇮🇳',
      'nl': '🇳🇱', 'pl': '🇵🇱', 'tr': '🇹🇷'
    };
    return flags[lang] || '🌐';
  }

  getLanguageName(lang: string): string {
    const names: { [key: string]: string } = {
      'es': 'Español', 'en': 'English', 'fr': 'Français', 'de': 'Deutsch',
      'pt': 'Português', 'it': 'Italiano', 'ru': 'Русский', 'zh-cn': '中文',
      'ja': '日本語', 'ko': '한국어', 'ar': 'العربية', 'hi': 'हिन्दी',
      'nl': 'Nederlands', 'pl': 'Polski', 'tr': 'Türkçe'
    };
    return names[lang] || lang.toUpperCase();
  }
}
