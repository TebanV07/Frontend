import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { VideoService, Video } from '../../../../core/services/video.service';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CommentListComponent } from '../../../posts/comments/comment-list/comment-list.component';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, CommentListComponent, TranslateModule],
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss']
})
export class VideosComponent implements OnInit, AfterViewInit {
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;

  videos: Video[] = [];
  currentVideoIndex = 0;
  showTranslation = false;
  isPlaying = false;
  isMuted = true; // Empezar muted por politica de navegadores
  isLoading = true;
  currentSubtitleUrl?: string;
  ttsProvider: 'openai' | 'elevenlabs' = 'openai';
  cloneVoice = false;
  showVoiceOptions = false;
  showCommentsPanel = false;
currentUserId: number | null = null;

  // Traduccion
  showLanguageMenu = false;
  availableLanguages: string[] = [];
  currentLanguage = 'es';
  isTranslating = false;
  translationJobId?: number;
  translationProgress = 0;
  includeAudioDubbing = false;
  showDubbingOption = false;
  currentDubbedVideoUrl: string | null = null;


  private showMessage(message: string): void {
    if (typeof window !== 'undefined' && typeof alert !== 'undefined') {
      alert(message);
    } else {
      console.debug(message);
    }
  }

  constructor(private videoService: VideoService) {}

 ngOnInit() {
  this.loadVideos();
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  this.currentUserId = user?.id ?? null;
}


  ngAfterViewInit() {
    // Configurar el video player despues de que la vista se inicialice
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      video.volume = 1.0; // Volumen al maximo
    }
  }

  loadVideos() {
    this.isLoading = true;
    this.videoService.getVideos(1, 20).subscribe({
      next: (videos) => {
        this.videos = videos;
        this.isLoading = false;
        if (videos.length > 0) {
          this.videoService.setCurrentVideo(videos[0]);
          this.currentLanguage = videos[0].original_language || 'es';
        }
      },
      error: (error) => {
        console.error('Error loading videos:', error);
        this.isLoading = false;
        this.showMessage('Error al cargar videos. Por favor intenta de nuevo.');
      }
    });
  }

  // ==================== CONTROL DE VIDEO ====================

  onVideoLoaded(event: Event) {
    const video = event.target as HTMLVideoElement;

    video.volume = 1.0;

    video.play().catch((error: any) => {
      console.warn('Autoplay bloqueado por el navegador:', error);
      this.isPlaying = false;
    });
  }

  onVideoError(event: Event) {
    console.error('Error al cargar video');
    const video = event.target as HTMLVideoElement;

    if (video.error) {
      console.error('Codigo de error:', video.error.code);
      console.error('Mensaje:', video.error.message);

      switch (video.error.code) {
        case 1:
          console.error('Descarga abortada');
          break;
        case 2:
          console.error('Error de red');
          this.showMessage('Error de red. Verifica tu conexion.');
          break;
        case 3:
          console.error('Error al decodificar');
          this.showMessage('Error al decodificar el video.');
          break;
        case 4:
          console.error('Formato no soportado o URL incorrecta');
          this.showMessage('Video no encontrado o formato no soportado');
          break;
      }
    }
  }

  onVideoPlay() {
    this.isPlaying = true;
  }

  onVideoPause() {
    this.isPlaying = false;
  }

  togglePlay() {
    if (!this.videoPlayer) return;

    const video = this.videoPlayer.nativeElement;

    if (video.paused) {
      video.play().catch((error: any) => {
        console.error('Error al reproducir:', error);
        this.showMessage('Error al reproducir. Intenta de nuevo.');
      });
    } else {
      video.pause();
    }
  }

  toggleMute() {
    if (!this.videoPlayer) return;

    const video = this.videoPlayer.nativeElement;
    this.isMuted = !this.isMuted;
    video.muted = this.isMuted;

    if (!this.isMuted && video.volume === 0) {
      video.volume = 1.0;
    }

    this.showTemporaryFeedback(this.isMuted ? 'Audio silenciado' : 'Audio activado');
  }

  private showTemporaryFeedback(message: string) {
    console.debug(message);
  }

  private pauseCurrentVideo() {
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      video.pause();
      video.currentTime = 0;
    }
  }

  // ==================== NAVEGACION ====================

  @HostListener('wheel', ['$event'])
  onScroll(event: WheelEvent) {
    if (event.deltaY > 0) {
      this.nextVideo();
    } else {
      this.previousVideo();
    }
    event.preventDefault();
  }

  nextVideo() {
    this.pauseCurrentVideo();

    if (this.currentVideoIndex < this.videos.length - 1) {
      this.currentVideoIndex++;
      const nextVideo = this.videos[this.currentVideoIndex];
      this.videoService.setCurrentVideo(nextVideo);
      this.currentLanguage = nextVideo.original_language || 'es';
      this.showTranslation = false;
      this.showLanguageMenu = false;
    } else {
      this.loadMoreVideos();
    }
  }

  previousVideo() {
    this.pauseCurrentVideo();

    if (this.currentVideoIndex > 0) {
      this.currentVideoIndex--;
      const prevVideo = this.videos[this.currentVideoIndex];
      this.videoService.setCurrentVideo(prevVideo);
      this.currentLanguage = prevVideo.original_language || 'es';
      this.showTranslation = false;
      this.showLanguageMenu = false;
    }
  }

  loadMoreVideos() {
    const nextPage = Math.floor(this.videos.length / 20) + 1;
    this.videoService.getVideos(nextPage, 20).subscribe({
      next: (newVideos) => {
        this.videos = [...this.videos, ...newVideos];
        if (newVideos.length > 0) {
          this.nextVideo();
        }
      },
      error: (error) => {
        console.error('Error loading more videos:', error);
      }
    });
  }

  // ==================== TRADUCCION ====================

  loadAvailableLanguages(video: Video) {
    if (video.available_languages && video.available_languages.length > 0) {
      this.availableLanguages = video.available_languages;
    } else {
      // Idiomas por defecto disponibles para traducir
      this.availableLanguages = [
        video.original_language || 'es', // Idioma original primero
        'es', 'en', 'fr', 'de', 'pt', 'it', 'ru', 'zh-cn', 'ja', 'ko'
      ];
      // Eliminar duplicados
      this.availableLanguages = [...new Set(this.availableLanguages)];
    }
  }

  toggleTranslation() {
    this.showLanguageMenu = !this.showLanguageMenu;

    if (this.showLanguageMenu && this.currentVideo) {
      this.loadAvailableLanguages(this.currentVideo);
    }
  }

requestTranslation(targetLanguage: string) {
  const video = this.currentVideo;
  if (!video) return;

  this.includeAudioDubbing = false;
  this.ttsProvider = 'openai';
  this.cloneVoice = false;

  // Si el idioma es el original, no traducir
  if (targetLanguage === video.original_language) {
    this.currentLanguage = targetLanguage;
    this.showLanguageMenu = false;
    this.showMessage('Este es el idioma original del video');
    return;
  }

  // Verificar si ya existe la traducción
  if (video.available_languages?.includes(targetLanguage)) {
    this.switchToLanguage(targetLanguage);
    return;
  }

  // PASO 1: Preguntar si quiere audio
  const wantAudio = confirm('Deseas incluir doblaje de audio? (mas costoso y lento)');

  if (!wantAudio) {
    // SOLO SUBTITULOS
    this.isTranslating = true;
    this.translationProgress = 0;

    this.videoService.requestVideoTranslation(
      video.id,
      [targetLanguage],
      false,      // includeAudio
      'vtt',      // subtitleFormat
      'openai',   // ttsProvider (no importa)
      false,      // cloneVoice
      false       // useSyncedTTS
    ).subscribe({
      next: (response) => this.handleTranslationResponse(response, video, targetLanguage),
      error: (error) => this.handleTranslationError(error)
    });
    return;
  }

  this.includeAudioDubbing = true;

  // PASO 2: Preguntar tipo de voz
  const wantPremium = confirm('Usar voz premium (ElevenLabs)?\n\n- Estandar (OpenAI): Rapido y economico\n- Premium (ElevenLabs): Mejor calidad, puede clonar voz');

  if (wantPremium) {
    this.ttsProvider = 'elevenlabs';

    // PASO 3: Preguntar por clonacion
    const wantClone = confirm('Quieres clonar la voz del video original?\n\n(Calidad superior - Requiere API Key de ElevenLabs)');
    this.cloneVoice = wantClone;
  } else {
    this.ttsProvider = 'openai';
    this.cloneVoice = false;
  }

  // ENVIAR CON LOS PARAMETROS COMPLETOS
  this.isTranslating = true;
  this.translationProgress = 0;

  this.videoService.requestVideoTranslation(
    video.id,
    [targetLanguage],
    true,                    // includeAudio: true
    'vtt',                   // subtitleFormat
    this.ttsProvider,        // ttsProvider ('openai' o 'elevenlabs')
    this.cloneVoice,         // cloneVoice (true/false)
    true                     // useSyncedTTS: true (siempre para mejor sync)
  ).subscribe({
    next: (response) => this.handleTranslationResponse(response, video, targetLanguage),
    error: (error) => this.handleTranslationError(error)
  });
}
requestTranslationSubtitlesOnly(video: Video, targetLanguage: string) {
  this.isTranslating = true;
  this.translationProgress = 0;

  this.videoService.requestVideoTranslation(
    video.id,
    [targetLanguage],
    false,  // includeAudio: false
    'vtt',
    'openai',  // ttsProvider (no importa porque no hay audio)
    false,     // cloneVoice
    false      // useSyncedTTS
  ).subscribe({
    next: (response) => {
      this.translationJobId = response.job_id;
      this.showMessage(`Subtitulos en tramite. Tiempo estimado: ${response.estimated_time_minutes} min`);
      this.pollTranslationStatus(video.id, response.job_id, targetLanguage);
    },
    error: (error) => {
      console.error('Error:', error);
      this.isTranslating = false;
      this.showMessage('Error al solicitar traduccion');
    }
  });
}

sendTranslationWithOptions(video: Video, targetLanguage: string) {
  this.isTranslating = true;
  this.translationProgress = 0;

  this.videoService.requestVideoTranslation(
    video.id,
    [targetLanguage],
    this.includeAudioDubbing,
    'vtt',
    this.ttsProvider,
    this.cloneVoice,
    true  // useSyncedTTS
  ).subscribe({
    next: (response) => {
      this.translationJobId = response.job_id;

      // Mensaje personalizado segun opciones
      let message = '';
      if (this.ttsProvider === 'openai') {
        message = `Traduccion estandar iniciada. Tiempo estimado: ${response.estimated_time_minutes} min`;
      } else if (this.ttsProvider === 'elevenlabs' && !this.cloneVoice) {
        message = `Traduccion premium iniciada. Tiempo estimado: ${response.estimated_time_minutes} min`;
      } else if (this.ttsProvider === 'elevenlabs' && this.cloneVoice) {
        message = `Clonacion de voz activada. Tiempo estimado: ${response.estimated_time_minutes} min`;
      }

      this.showMessage(message);

      // Iniciar polling del progreso
      this.pollTranslationStatus(video.id, response.job_id, targetLanguage);
    },
    error: (error) => {
      console.error('Error solicitando traduccion:', error);
      this.isTranslating = false;
      this.showDubbingOption = false;

      let errorMsg = 'Error al solicitar traduccion.';
      if (error.error?.detail) {
        errorMsg = error.error.detail;
      }
      this.showMessage(errorMsg);
    }
  });
}

  private pollTranslationStatus(videoId: number, jobId: number, targetLanguage: string) {
    let pollCount = 0;
    const maxPolls = 200; // Maximo 10 minutos (200 * 3 segundos)

    const interval = setInterval(() => {
      pollCount++;

      if (pollCount > maxPolls) {
        clearInterval(interval);
        this.isTranslating = false;
        this.showMessage('Tiempo de espera agotado. La traduccion puede seguir procesandose.');
        return;
      }

 this.videoService.getTranslationStatus(videoId, jobId).subscribe({
  next: (job) => {
    this.translationProgress = job.progress;

    if (job.status === 'completed') {
      clearInterval(interval);
      this.isTranslating = false;
      this.showMessage('Traduccion completada');

      // Actualizar idiomas disponibles en el video
      if (this.currentVideo) {
        // Agregar manualmente si completed_languages esta vacio
        if (job.completed_languages && job.completed_languages.length > 0) {
          this.currentVideo.available_languages = [
            ...(this.currentVideo.available_languages || []),
            ...job.completed_languages
          ];
          this.currentVideo.available_languages = [...new Set(this.currentVideo.available_languages)];
        } else {
          console.warn('completed_languages esta vacio, agregando manualmente');
          if (!this.currentVideo.available_languages) {
            this.currentVideo.available_languages = [];
          }
          if (!this.currentVideo.available_languages.includes(targetLanguage)) {
            this.currentVideo.available_languages.push(targetLanguage);
          }
        }
      }

      // Cambiar al idioma traducido
      this.switchToLanguage(targetLanguage);
    } else if (job.status === 'failed') {
      clearInterval(interval);
      this.isTranslating = false;
      console.error('Traduccion fallida:', job.error_message);
      this.showMessage(`Error: ${job.error_message || 'Traduccion fallida'}`);
    }
  },
  error: (error) => {
    console.error('Error obteniendo estado de traduccion:', error);
    clearInterval(interval);
    this.isTranslating = false;
    this.showMessage('Error al verificar el estado de la traduccion');
  }
});
}, 3000); // Polling cada 3 segundos
}

switchToLanguage(language: string) {
  const video = this.currentVideo;
  if (!video || !this.videoPlayer) return;

  this.currentLanguage = language;
  this.showLanguageMenu = false;
  this.showDubbingOption = false;

  const videoElement = this.videoPlayer.nativeElement;

  // Probar si existe video doblado (TTS)
  this.videoService.getDubbedVideo(video.id, language).subscribe({
    next: (dubbed) => {
      const wasPlaying = !videoElement.paused;
      const currentTime = videoElement.currentTime;

      videoElement.pause();

      videoElement.src = dubbed.translated_video_url;
      videoElement.load();

      videoElement.onloadedmetadata = () => {
        videoElement.currentTime = currentTime;
        videoElement.muted = false;
        videoElement.volume = 1.0;

        if (wasPlaying) {
          videoElement.play().catch(() => {});
        }
      };

      this.showMessage(`Reproduciendo doblaje en ${this.getLanguageName(language)}`);
    },

    // Si no hay doblaje, usar subtitulos
    error: (err) => {
      console.debug('No hay doblaje disponible, buscando subtitulos...', err?.status, err?.statusText);

      this.videoService.getSubtitles(video.id, language).subscribe({
        next: (subtitles) => {
          if (subtitles.subtitle_url) {
            this.currentSubtitleUrl = subtitles.subtitle_url;

            // Forzar recarga de tracks
            setTimeout(() => {
              videoElement.load();
            }, 100);
          }

          this.showMessage(`Subtitulos en ${this.getLanguageName(language)}`);
        },
        error: (subErr) => {
          console.error('Error obteniendo subtitulos:', subErr);
          this.showMessage('No hay doblaje ni subtitulos disponibles');
        }
      });
    }
  });
}
  // ==================== ACCIONES ====================

  toggleLike(video: Video) {
    this.videoService.toggleLike(video.id).subscribe({
      next: (response) => {
        video.is_liked = response.is_liked;
        video.likes_count = response.likes_count;
      },
      error: (error) => {
        console.error('Error toggling like:', error);
        this.showMessage('Error al dar like. Intenta de nuevo.');
      }
    });
  }

  toggleBookmark(video: Video) {
    this.videoService.toggleBookmark(video.id).subscribe({
      next: (response) => {
        video.is_saved = response.is_saved;
        this.showMessage(response.is_saved ? 'Video guardado' : 'Video eliminado de guardados');
      },
      error: (error) => {
        console.error('Error toggling bookmark:', error);
        this.showMessage('Error al guardar. Intenta de nuevo.');
      }
    });
  }

  shareVideo(video: Video) {
    this.videoService.shareVideo(video.id).subscribe({
      next: (response) => {
        video.shares_count = response.shares_count;
        const shareUrl = `${window.location.origin}/videos/${video.uuid}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          this.showMessage('Enlace copiado al portapapeles');
        }).catch(() => {
          this.showMessage(`Comparte este enlace: ${shareUrl}`);
        });
      },
      error: (error) => {
        console.error('Error sharing video:', error);
        this.showMessage('Error al compartir');
      }
    });
  }

  deleteVideo(video: Video): void {
  if (!confirm('¿Eliminar este video? Esta acción no se puede deshacer.')) return;

  this.videoService.deleteVideo(video.id).subscribe({
    next: () => {
      // Quitar el video de la lista local
      this.videos = this.videos.filter(v => v.id !== video.id);

      // Ajustar índice si hace falta
      if (this.currentVideoIndex >= this.videos.length) {
        this.currentVideoIndex = Math.max(0, this.videos.length - 1);
      }

      this.showMessage('Video eliminado correctamente');
    },
    error: (err) => {
      console.error('Error eliminando video:', err);
      this.showMessage('Error al eliminar el video. Intenta de nuevo.');
    }
  });
}

openComments(video: Video): void {
  this.showCommentsPanel = !this.showCommentsPanel;
}

  followUser(user: any) {
    this.showMessage('Sistema de seguir usuarios en desarrollo');
  }

  // ==================== HELPERS ====================

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  get currentVideo(): Video | null {
    return this.videos[this.currentVideoIndex] || null;
  }

  getVideoTitle(video: Video): string {
    return video.title || 'Sin titulo';
  }

  getVideoDescription(video: Video): string {
    return video.description || '';
  }

getUserName(video: Video): string {
  return (video.user as any)?.full_name || video.user?.username || 'Usuario';
}

getUserAvatar(video: Video): string {
  return (video.user as any)?.profile_picture_url || 'https://via.placeholder.com/100';
}

  isUserVerified(video: Video): boolean {
    return video.user?.is_verified || false;
  }

  getVideoThumbnail(video: Video): string {
    return video.thumbnail_url || 'https://via.placeholder.com/400x700';
  }

  getVideoUrl(video: Video): string {
    return video.video_url || '';
  }

  getLanguageFlag(lang: string): string {
    const flags: { [key: string]: string } = {
      'es': '????',
      'en': '????',
      'fr': '????',
      'de': '????',
      'pt': '????',
      'it': '????',
      'ru': '????',
      'zh-cn': '????',
      'ja': '????',
      'ko': '????',
      'ar': '????',
      'hi': '????',
      'nl': '????',
      'pl': '????',
      'tr': '????'
    };
    return flags[lang] || '??';
  }

  getLanguageName(lang: string): string {
    const names: { [key: string]: string } = {
      'es': 'Espanol',
      'en': 'English',
      'fr': 'Frances',
      'de': 'Deutsch',
      'pt': 'Portugues',
      'it': 'Italiano',
      'ru': 'Russian',
      'zh-cn': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Nederlands',
      'pl': 'Polski',
      'tr': 'Turkish'
    };
    return names[lang] || lang.toUpperCase();
  }
  // Prueba minima - helper temporal para validar clonacion
testClonacion() {
  console.debug('Probando clonacion...');
  const video = this.currentVideo;
  if (!video) return;

  this.videoService.requestVideoTranslation(
    video.id,
    ['en'],
    true,
    'vtt',
    'elevenlabs',
    true,
    true
  ).subscribe(response => {
    console.debug('Test clonacion OK:', response);
  });
}
private handleTranslationResponse(response: any, video: Video, targetLanguage: string) {
  this.translationJobId = response.job_id;

  // Mensaje segun configuracion
  let message = '';
  if (!this.includeAudioDubbing) {
    message = `Subtitulos en tramite. Tiempo: ${response.estimated_time_minutes} min`;
  } else if (this.ttsProvider === 'openai') {
    message = `Traduccion estandar iniciada. Tiempo: ${response.estimated_time_minutes} min`;
  } else if (this.ttsProvider === 'elevenlabs' && !this.cloneVoice) {
    message = `Traduccion premium iniciada. Tiempo: ${response.estimated_time_minutes} min`;
  } else {
    message = `Clonacion de voz activada. Tiempo: ${response.estimated_time_minutes} min`;
  }

  this.showMessage(message);
  this.pollTranslationStatus(video.id, response.job_id, targetLanguage);
}

private handleTranslationError(error: any) {
  console.error('Error solicitando traduccion:', error);
  this.isTranslating = false;
  this.showDubbingOption = false;

  let errorMsg = 'Error al solicitar traduccion.';
  if (error.error?.detail) {
    errorMsg = error.error.detail;
  }
  this.showMessage(errorMsg);
}
}


