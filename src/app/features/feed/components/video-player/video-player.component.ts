// app/features/feed/videos/video-player/video-player.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Video, VideoService } from '../../../../core/services/video.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements AfterViewInit, OnChanges {
  @Input() video!: Video;
  @Input() isPlaying = true;
  @Input() subtitleLanguage = 'es';
  @Output() videoEnded = new EventEmitter<void>();
  @Output() videoPlaying = new EventEmitter<boolean>();

  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;

  private videoElement!: HTMLVideoElement;
  private readonly apiBaseUrl = 'https://web-production-94f95.up.railway.app';

  // Estados
  isLoading = true;
  hasError = false;
  currentTime = 0;
  duration = 0;
  progress = 0;

  constructor(private videoService: VideoService) {}

  ngAfterViewInit() {
    this.videoElement = this.videoElementRef.nativeElement;
    this.setupVideo();
    this.loadSubtitles();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isPlaying'] && this.videoElement) {
      this.togglePlay();
    }

    if (changes['video'] && !changes['video'].firstChange && this.videoElement) {
      this.loadVideo();
      this.loadSubtitles();
    }

    if (changes['subtitleLanguage'] && !changes['subtitleLanguage'].firstChange) {
      this.changeSubtitleTrack();
    }
  }

  // ==================== SETUP ====================

  private setupVideo() {
    if (!this.videoElement) return;

    // Event listeners
    this.videoElement.addEventListener('loadedmetadata', () => {
      this.duration = this.videoElement.duration;
      this.isLoading = false;
      console.debug('Metadata de video cargada:', {
        duration: this.duration,
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight
      });
    });

    this.videoElement.addEventListener('timeupdate', () => {
      this.currentTime = this.videoElement.currentTime;
      this.progress = (this.currentTime / this.duration) * 100;
    });

    this.videoElement.addEventListener('ended', () => {
      this.videoEnded.emit();
    });

    this.videoElement.addEventListener('play', () => {
      this.videoPlaying.emit(true);
    });

    this.videoElement.addEventListener('pause', () => {
      this.videoPlaying.emit(false);
    });

    this.videoElement.addEventListener('error', (e) => {
      console.error('Error en el video:', e);
      this.hasError = true;
      this.isLoading = false;
    });

    this.videoElement.addEventListener('waiting', () => {
      this.isLoading = true;
    });

    this.videoElement.addEventListener('canplay', () => {
      this.isLoading = false;
    });

    // Auto-play si está configurado
    if (this.isPlaying) {
      this.playVideo();
    }
  }

  private loadVideo(): void {
  this.isLoading = true;
  this.hasError = false;
  this.videoElement.load();
}

retryLoad(): void {
  this.loadVideo();
}
  // ==================== SUBTÍTULOS ====================

  private loadSubtitles() {
    if (!this.video || !this.videoElement) return;

    // Limpiar tracks existentes
    const tracks = Array.from(this.videoElement.querySelectorAll('track'));
    tracks.forEach(track => track.remove());

    // Cargar subtítulos disponibles
    if (this.video.available_languages && this.video.available_languages.length > 0) {
      this.video.available_languages.forEach((lang, index) => {
        this.addSubtitleTrack(lang, index === 0);
      });
    }
  }

  private addSubtitleTrack(language: string, isDefault: boolean = false) {
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = this.getLanguageName(language);
    track.srclang = language;
    track.src = this.getSubtitleUrl(language);

    if (isDefault || language === this.subtitleLanguage) {
  track.default = true;
  track.track.mode = 'showing';
}

    this.videoElement.appendChild(track);

    console.debug('Track de subtitulos agregado:', {
      language,
      label: track.label,
      src: track.src,
      default: track.default
    });
  }

  private changeSubtitleTrack() {
    if (!this.videoElement) return;

    const tracks = this.videoElement.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (track.language === this.subtitleLanguage) {
        track.mode = 'showing';
      } else {
        track.mode = 'hidden';
      }
    }
  }

  private getSubtitleUrl(language: string): string {
    return `${this.apiBaseUrl}/api/v1/video_translations/videos/${this.video.id}/subtitles/${language}`;
  }

  // ==================== CONTROLES ====================

  togglePlay() {
    if (!this.videoElement) return;

    if (this.isPlaying) {
      this.playVideo();
    } else {
      this.pauseVideo();
    }
  }

  playVideo() {
    if (!this.videoElement) return;

    const playPromise = this.videoElement.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.debug('Video reproduciendose');
        })
        .catch(error => {
          console.warn('Autoplay bloqueado:', error);
          // Mostrar botón de play manual si autoplay está bloqueado
        });
    }
  }

  pauseVideo() {
    if (!this.videoElement) return;
    this.videoElement.pause();
    console.debug('Video pausado');
  }

  seek(time: number) {
    if (!this.videoElement) return;
    this.videoElement.currentTime = time;
  }

  seekToPercentage(percentage: number) {
    if (!this.videoElement) return;
    const time = (percentage / 100) * this.duration;
    this.seek(time);
  }

  toggleMute() {
    if (!this.videoElement) return;
    this.videoElement.muted = !this.videoElement.muted;
  }

  setVolume(volume: number) {
    if (!this.videoElement) return;
    this.videoElement.volume = Math.max(0, Math.min(1, volume));
  }

  // ==================== HELPERS ====================

  getVideoUrl(): string {
    if (!this.video?.video_url) return '';

    // Si la URL ya es completa, usarla directamente
    if (this.video.video_url.startsWith('http')) {
      return this.video.video_url;
    }

    // Si es relativa, construir URL completa
    return `${this.apiBaseUrl}${this.video.video_url}`;
  }

  getThumbnailUrl(): string {
    if (!this.video?.thumbnail_url) return '';

    if (this.video.thumbnail_url.startsWith('http')) {
      return this.video.thumbnail_url;
    }

    return `${this.apiBaseUrl}${this.video.thumbnail_url}`;
  }

  getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'en': 'English',
      'es': 'Espanol',
      'fr': 'Frances',
      'de': 'Deutsch',
      'pt': 'Portugues',
      'it': 'Italiano',
      'ja': 'Japones',
      'zh': 'Chino',
      'ko': 'Coreano'
    };
    return languages[code] || code.toUpperCase();
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  get currentTimeFormatted(): string {
    return this.formatTime(this.currentTime);
  }

  get durationFormatted(): string {
    return this.formatTime(this.duration);
  }

  get isMuted(): boolean {
    return this.videoElement?.muted || false;
  }

  get volume(): number {
    return this.videoElement?.volume || 1;
  }
}

