import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VideoService, Video } from '../../../../core/services/video.service';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CommentListComponent } from '../../../posts/comments/comment-list/comment-list.component';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, CommentListComponent],
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss']
})
export class VideosComponent implements OnInit, AfterViewInit {
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;

  videos: Video[] = [];
  currentVideoIndex = 0;
  showTranslation = false;
  isPlaying = false;
  isMuted = true; // Empezar muted por política de navegadores
  isLoading = true;
  currentSubtitleUrl?: string;
  ttsProvider: 'openai' | 'elevenlabs' = 'openai';
  cloneVoice = false;
  showVoiceOptions = false;
  showCommentsPanel = false;
currentUserId: number | null = null;

  // Traducción
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
      console.log(message);
    }
  }

  constructor(private videoService: VideoService) {}

 ngOnInit() {
  this.loadVideos();
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  this.currentUserId = user?.id ?? null;
}


  ngAfterViewInit() {
    // Configurar el video player después de que la vista se inicialice
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      video.volume = 1.0; // Volumen al máximo
      console.log('🔊 Video player inicializado. Volume:', video.volume, 'Muted:', video.muted);
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
    console.log('✅ Video cargado correctamente');
    const video = event.target as HTMLVideoElement;

    // Establecer volumen
    video.volume = 1.0;
    console.log('🔊 Volumen establecido:', video.volume);

    // Intentar reproducir
    video.play().catch((error: any) => {
      console.error('⚠️ Autoplay bloqueado por el navegador:', error);
      this.isPlaying = false;
      // Mostrar indicador visual para que el usuario haga clic
    });
  }

  onVideoError(event: Event) {
    console.error('❌ Error al cargar video');
    const video = event.target as HTMLVideoElement;

    if (video.error) {
      console.error('Código de error:', video.error.code);
      console.error('Mensaje:', video.error.message);

      switch (video.error.code) {
        case 1:
          console.error('Descarga abortada');
          break;
        case 2:
          console.error('Error de red');
          this.showMessage('Error de red. Verifica tu conexión.');
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
    console.log('▶️ Video reproduciendo');
  }

  onVideoPause() {
    this.isPlaying = false;
    console.log('⏸️ Video pausado');
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

    console.log(this.isMuted ? '🔇 Audio silenciado' : '🔊 Audio activado');
    console.log('Volume:', video.volume, 'Muted:', video.muted);

    // Verificar que el video tenga audio
    if (!this.isMuted && video.volume === 0) {
      video.volume = 1.0;
      console.log('🔊 Volumen restaurado a:', video.volume);
    }

    // Feedback visual temporal
    this.showTemporaryFeedback(this.isMuted ? '🔇' : '🔊');
  }

  private showTemporaryFeedback(emoji: string) {
    // Puedes implementar un toast o notificación visual aquí
    console.log('Feedback:', emoji);
  }

  private pauseCurrentVideo() {
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      video.pause();
      video.currentTime = 0;
    }
  }

  // ==================== NAVEGACIÓN ====================

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

  // ==================== TRADUCCIÓN ====================

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

  // 🔄 RESET para pruebas
  this.includeAudioDubbing = false;
  this.ttsProvider = 'openai';
  this.cloneVoice = false;

  console.log(`🌐 Solicitando traducción a: ${targetLanguage}`);

  // Si el idioma es el original, no traducir
  if (targetLanguage === video.original_language) {
    this.currentLanguage = targetLanguage;
    this.showLanguageMenu = false;
    this.showMessage('Este es el idioma original del video');
    return;
  }

  // Verificar si ya existe la traducción
  if (video.available_languages?.includes(targetLanguage)) {
    console.log('✅ Traducción ya disponible');
    this.switchToLanguage(targetLanguage);
    return;
  }

  // PASO 1: Preguntar si quiere audio
  const wantAudio = confirm('¿Deseas incluir doblaje de audio? (más costoso y lento)');

  if (!wantAudio) {
    // SOLO SUBTÍTULOS (3 parámetros)
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
  const wantPremium = confirm('¿Usar voz premium (ElevenLabs)?\n\n• Estándar (OpenAI): Rápido y económico\n• Premium (ElevenLabs): Mejor calidad, puede clonar voz');

  if (wantPremium) {
    this.ttsProvider = 'elevenlabs';

    // PASO 3: Preguntar por clonación
    const wantClone = confirm('¿Quieres CLONAR la voz del video original?\n\n(Calidad superior - Requiere API Key de ElevenLabs)');
    this.cloneVoice = wantClone;
  } else {
    this.ttsProvider = 'openai';
    this.cloneVoice = false;
  }

  // ENVIAR CON LOS 7 PARÁMETROS
  this.isTranslating = true;
  this.translationProgress = 0;

  console.log('🎙️ Configuración final:');
  console.log('  - TTS Provider:', this.ttsProvider);
  console.log('  - Clone Voice:', this.cloneVoice);

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
  console.log('📝 Solicitando solo subtítulos...');

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
      console.log('✅ Solo subtítulos solicitados:', response);
      this.translationJobId = response.job_id;
      this.showMessage(`Subtítulos en trámite. Tiempo estimado: ${response.estimated_time_minutes} min`);
      this.pollTranslationStatus(video.id, response.job_id, targetLanguage);
    },
    error: (error) => {
      console.error('❌ Error:', error);
      this.isTranslating = false;
      this.showMessage('Error al solicitar traducción');
    }
  });
}

sendTranslationWithOptions(video: Video, targetLanguage: string) {
  this.isTranslating = true;
  this.translationProgress = 0;

  console.log('📤 Enviando solicitud de traducción completa...');
  console.log('🎙️ TTS Provider:', this.ttsProvider);
  console.log('🎤 Clone Voice:', this.cloneVoice);
  console.log('🔊 Include Audio:', this.includeAudioDubbing);

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
      console.log('✅ Traducción solicitada:', response);
      this.translationJobId = response.job_id;

      // Mensaje personalizado según opciones
      let message = '';
      if (this.ttsProvider === 'openai') {
        message = `Traducción estándar iniciada. Tiempo estimado: ${response.estimated_time_minutes} min`;
      } else if (this.ttsProvider === 'elevenlabs' && !this.cloneVoice) {
        message = `Traducción premium iniciada. Tiempo estimado: ${response.estimated_time_minutes} min`;
      } else if (this.ttsProvider === 'elevenlabs' && this.cloneVoice) {
        message = `🎙️ ¡CLONACIÓN DE VOZ ACTIVADA! Tiempo estimado: ${response.estimated_time_minutes} min`;
      }

      this.showMessage(message);

      // Iniciar polling del progreso
      this.pollTranslationStatus(video.id, response.job_id, targetLanguage);
    },
    error: (error) => {
      console.error('❌ Error solicitando traducción:', error);
      this.isTranslating = false;
      this.showDubbingOption = false;

      let errorMsg = 'Error al solicitar traducción.';
      if (error.error?.detail) {
        errorMsg = error.error.detail;
      }
      this.showMessage(errorMsg);
    }
  });
}

  private pollTranslationStatus(videoId: number, jobId: number, targetLanguage: string) {
    let pollCount = 0;
    const maxPolls = 200; // Máximo 10 minutos (200 * 3 segundos)

    const interval = setInterval(() => {
      pollCount++;

      if (pollCount > maxPolls) {
        clearInterval(interval);
        this.isTranslating = false;
        this.showMessage('Tiempo de espera agotado. La traducción puede seguir procesándose.');
        return;
      }

 this.videoService.getTranslationStatus(videoId, jobId).subscribe({
  next: (job) => {
    console.log(`📊 Progreso de traducción: ${job.progress}% - Estado: ${job.status}`);
    console.log('🔍 JOB COMPLETO:', JSON.stringify(job, null, 2));
    this.translationProgress = job.progress;

    if (job.status === 'completed') {
      clearInterval(interval);
      this.isTranslating = false;
      console.log('✅ Traducción completada!');
      console.log('🌍 Completed languages:', job.completed_languages);
      console.log('❌ Failed languages:', job.failed_languages);
      this.showMessage('¡Traducción completada!');

      // Actualizar idiomas disponibles en el video
      if (this.currentVideo) {
        console.log('🔄 Actualizando idiomas del video...');
        console.log('📋 Idiomas actuales:', this.currentVideo.available_languages);

        // ✅ AGREGAR MANUALMENTE si completed_languages está vacío
        if (job.completed_languages && job.completed_languages.length > 0) {
          // Usar los idiomas del job
          this.currentVideo.available_languages = [
            ...(this.currentVideo.available_languages || []),
            ...job.completed_languages
          ];
          // Eliminar duplicados
          this.currentVideo.available_languages = [...new Set(this.currentVideo.available_languages)];
        } else {
          // Fallback: agregar manualmente el idioma traducido
          console.warn('⚠️ completed_languages está vacío, agregando manualmente');
          if (!this.currentVideo.available_languages) {
            this.currentVideo.available_languages = [];
          }
          if (!this.currentVideo.available_languages.includes(targetLanguage)) {
            this.currentVideo.available_languages.push(targetLanguage);
          }
        }

        console.log('✅ Idiomas actualizados:', this.currentVideo.available_languages);
      }

      // Cambiar al idioma traducido
      console.log(`🔄 Cambiando a idioma: ${targetLanguage}`);
      this.switchToLanguage(targetLanguage);
    } else if (job.status === 'failed') {
      clearInterval(interval);
      this.isTranslating = false;
      console.error('❌ Traducción fallida:', job.error_message);
      this.showMessage(`Error: ${job.error_message || 'Traducción fallida'}`);
    }
  },
  error: (error) => {
    console.error('Error obteniendo estado de traducción:', error);
    clearInterval(interval);
    this.isTranslating = false;
    this.showMessage('Error al verificar el estado de la traducción');
  }
});
}, 3000); // Polling cada 3 segundos
}

switchToLanguage(language: string) {
  const video = this.currentVideo;
  if (!video || !this.videoPlayer) return;

  console.log(`🌐 Cambiando a idioma: ${language}`);
  console.log('📋 Video ID:', video.id);
  console.log('🎯 Idioma objetivo:', language);

  this.currentLanguage = language;
  this.showLanguageMenu = false;
  this.showDubbingOption = false;

  const videoElement = this.videoPlayer.nativeElement;

  // 🧪 1️⃣ PROBAR SI EXISTE VIDEO DOBLADO (TTS)
  console.log('🔍 Buscando video doblado...');
  this.videoService.getDubbedVideo(video.id, language).subscribe({
    next: (dubbed) => {
      console.log('🎙️ ✅ Doblaje encontrado:', dubbed);
      console.log('🎬 URL video doblado:', dubbed.translated_video_url);

      const wasPlaying = !videoElement.paused;
      const currentTime = videoElement.currentTime;

      console.log('⏸️ Pausando video actual...');
      videoElement.pause();

      console.log('🔄 Cargando video doblado:', dubbed.translated_video_url);
      videoElement.src = dubbed.translated_video_url;
      videoElement.load();

      videoElement.onloadedmetadata = () => {
        console.log('✅ Metadata cargada del video doblado');
        videoElement.currentTime = currentTime;
        videoElement.muted = false;
        videoElement.volume = 1.0;
        console.log('🔊 Audio activado - Volume:', videoElement.volume);

        if (wasPlaying) {
          console.log('▶️ Reproduciendo video doblado...');
          videoElement.play();
        }
      };

      this.showMessage(`🎙️ Reproduciendo doblaje en ${this.getLanguageName(language)}`);
    },

    // ❌ 2️⃣ SI NO HAY DOBLAJE → USAR SUBTÍTULOS
    error: (err) => {
      console.log('ℹ️ No hay doblaje disponible, buscando subtítulos...');
      console.log('🔍 Error del doblaje:', err.status, err.statusText);

      this.videoService.getSubtitles(video.id, language).subscribe({
        next: (subtitles) => {
          console.log('📝 ✅ Subtítulos encontrados:', subtitles);
          console.log('📄 URL subtítulos:', subtitles.subtitle_url);

          if (subtitles.subtitle_url) {
            this.currentSubtitleUrl = subtitles.subtitle_url;
            console.log('✅ currentSubtitleUrl actualizado:', this.currentSubtitleUrl);

            // Forzar recarga de tracks
            console.log('🔄 Recargando tracks de subtítulos...');
            setTimeout(() => {
              videoElement.load();
              console.log('✅ Tracks recargados');
            }, 100);
          }

          this.showMessage(`📝 Subtítulos en ${this.getLanguageName(language)}`);
        },
        error: (subErr) => {
          console.error('❌ Error obteniendo subtítulos:', subErr);
          this.showMessage('No hay doblaje ni subtítulos disponibles');
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
        console.log(response.is_liked ? '❤️ Like agregado' : '💔 Like removido');
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
        this.showMessage(response.is_saved ? '¡Video guardado!' : 'Video eliminado de guardados');
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
          this.showMessage('¡Enlace copiado al portapapeles!');
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

openComments(video: Video): void {
  this.showCommentsPanel = !this.showCommentsPanel;
}

  followUser(user: any) {
    console.log('Following user:', user?.username);
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
    return video.title || 'Sin título';
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
      'es': '🇪🇸',
      'en': '🇬🇧',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'pt': '🇵🇹',
      'it': '🇮🇹',
      'ru': '🇷🇺',
      'zh-cn': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
      'nl': '🇳🇱',
      'pl': '🇵🇱',
      'tr': '🇹🇷'
    };
    return flags[lang] || '🌐';
  }

  getLanguageName(lang: string): string {
    const names: { [key: string]: string } = {
      'es': 'Español',
      'en': 'English',
      'fr': 'Français',
      'de': 'Deutsch',
      'pt': 'Português',
      'it': 'Italiano',
      'ru': 'Русский',
      'zh-cn': '中文',
      'ja': '日本語',
      'ko': '한국어',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'nl': 'Nederlands',
      'pl': 'Polski',
      'tr': 'Türkçe'
    };
    return names[lang] || lang.toUpperCase();
  }
  // Prueba mínima - agrega esto temporalmente para ver si compila:
testClonacion() {
  console.log('🔧 Probando clonación...');
  const video = this.currentVideo;
  if (!video) return;

  // Prueba directa
  this.videoService.requestVideoTranslation(
    video.id,
    ['en'],
    true,
    'vtt',
    'elevenlabs',
    true,  // ← CLONACIÓN ACTIVADA
    true
  ).subscribe(response => {
    console.log('✅ Test clonación OK:', response);
  });
}
private handleTranslationResponse(response: any, video: Video, targetLanguage: string) {
  console.log('✅ Traducción solicitada:', response);
  this.translationJobId = response.job_id;

  // Mensaje según configuración
  let message = '';
  if (!this.includeAudioDubbing) {
    message = `Subtítulos en trámite. Tiempo: ${response.estimated_time_minutes} min`;
  } else if (this.ttsProvider === 'openai') {
    message = `Traducción estándar iniciada. Tiempo: ${response.estimated_time_minutes} min`;
  } else if (this.ttsProvider === 'elevenlabs' && !this.cloneVoice) {
    message = `Traducción premium iniciada. Tiempo: ${response.estimated_time_minutes} min`;
  } else {
    message = `🎙️ ¡CLONACIÓN DE VOZ ACTIVADA! Tiempo: ${response.estimated_time_minutes} min`;
  }

  this.showMessage(message);
  this.pollTranslationStatus(video.id, response.job_id, targetLanguage);
}

private handleTranslationError(error: any) {
  console.error('❌ Error solicitando traducción:', error);
  this.isTranslating = false;
  this.showDubbingOption = false;

  let errorMsg = 'Error al solicitar traducción.';
  if (error.error?.detail) {
    errorMsg = error.error.detail;
  }
  this.showMessage(errorMsg);
}
}
