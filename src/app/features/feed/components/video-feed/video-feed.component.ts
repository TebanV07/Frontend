// app/features/feed/videos/video-feed/video-feed.component.ts

import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { VideoService, Video } from '../../../../core/services/video.service';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { VideoOverlayComponent } from '../video-overlay/video-overlay.component';

@Component({
  selector: 'app-video-feed',
  standalone: true,
  imports: [CommonModule, VideoPlayerComponent, VideoOverlayComponent, TranslateModule],
  templateUrl: './video-feed.component.html',
  styleUrls: ['./video-feed.component.scss']
})
export class VideoFeedComponent implements OnInit {
  @ViewChild('feedContainer') feedContainer!: ElementRef;

  videos: Video[] = [];
  currentVideoIndex = 0;
  isPlaying = true;
  isLoading = false;
  hasMore = true;

  // Paginacion
  private currentPage = 1;
  private pageSize = 10;

  constructor(private videoService: VideoService) {}

  ngOnInit() {
    this.loadVideos();
  }

  // ==================== CARGAR VIDEOS DESDE BACKEND ====================

  loadVideos(append: boolean = false) {
    if (this.isLoading) return;

    this.isLoading = true;

    this.videoService.getVideosFeed(
      this.currentPage,
      this.pageSize,
      'for_you' // Puedes cambiar a 'trending' o 'following'
    ).subscribe({
      next: (response) => {
        if (append) {
          this.videos = [...this.videos, ...response.videos];
        } else {
          this.videos = response.videos;
        }

        this.hasMore = response.has_more;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando videos:', error);
        this.isLoading = false;

        // Fallback a datos mock solo si falla
        if (this.videos.length === 0) {
          console.warn('Usando datos mock como fallback');
          this.loadMockVideos();
        }
      }
    });
  }

  // ==================== SCROLL INFINITO ====================

  @HostListener('window:scroll', [])
  onScroll() {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= pageHeight - 500 && this.hasMore && !this.isLoading) {
      this.currentPage++;
      this.loadVideos(true);
    }
  }

  // ==================== NAVEGACION ====================

  onVideoEnded() {
    if (this.currentVideoIndex < this.videos.length - 1) {
      this.currentVideoIndex++;
    } else {
      // Cargar mas videos si llegamos al final
      if (this.hasMore) {
        this.currentPage++;
        this.loadVideos(true);
      }
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    // Navegacion con scroll del mouse
    if (event.deltaY > 0) {
      this.nextVideo();
    } else if (event.deltaY < 0) {
      this.previousVideo();
    }
  }

  nextVideo() {
    if (this.currentVideoIndex < this.videos.length - 1) {
      this.currentVideoIndex++;
    }
  }

  previousVideo() {
    if (this.currentVideoIndex > 0) {
      this.currentVideoIndex--;
    }
  }

  onSwipe(direction: 'up' | 'down') {
    if (direction === 'up') {
      this.nextVideo();
    } else if (direction === 'down') {
      this.previousVideo();
    }
  }

  // ==================== ACCIONES DE VIDEO ====================

  onLike(video: Video) {
    this.videoService.toggleLike(video.id).subscribe({
      next: (response) => {
        video.is_liked = response.is_liked;
        video.likes_count = response.likes_count;
      },
      error: (error) => {
        console.error('Error al dar like:', error);
      }
    });
  }

  onComment(video: Video) {
    // TODO: Implementar modal de comentarios
  }

  onShare(video: Video) {
    this.videoService.shareVideo(video.id).subscribe({
      next: (response) => {
        video.shares_count = response.shares_count;

        const link = `${window.location.origin}/videos/${video.uuid}`;
        navigator.clipboard.writeText(link).then(() => {
          alert('Link copiado al portapapeles');
        });
      },
      error: (error) => {
        console.error('Error al compartir:', error);
      }
    });
  }

  onSave(video: Video) {
    this.videoService.toggleSave(video.id).subscribe({
      next: (response) => {
        video.is_saved = response.is_saved;
        video.shares_count = response.saves_count;
      },
      error: (error) => {
        console.error('Error al guardar:', error);
      }
    });
  }

  // ==================== TRADUCCION DE VIDEO ====================

  onRequestTranslation(video: Video, targetLanguage: string) {
    this.videoService.requestVideoTranslation(
      video.id,
      [targetLanguage]
    ).subscribe({
      next: (response) => {
        alert(`Traduccion iniciada\nJob ID: ${response.job_id}\nTiempo estimado: ${response.estimated_time_minutes} minutos`);

        this.pollTranslationStatus(video.id, response.job_id);
      },
      error: (error) => {
        console.error('Error solicitando traduccion:', error);
        alert('Error al solicitar traduccion. Verifica que el video este procesado.');
      }
    });
  }

  private pollTranslationStatus(videoId: number, jobId: number) {
    const interval = setInterval(() => {
      this.videoService.getTranslationStatus(videoId, jobId).subscribe({
        next: (status) => {
          if (status.status === 'COMPLETED') {
            clearInterval(interval);
            alert('Traduccion completada. Recarga el video para ver los subtitulos.');

            this.videoService.getVideo(videoId).subscribe({
              next: (updatedVideo) => {
                const index = this.videos.findIndex(v => v.id === videoId);
                if (index !== -1) {
                  this.videos[index] = updatedVideo;
                }
              }
            });
          } else if (status.status === 'FAILED') {
            clearInterval(interval);
            alert(`Traduccion fallida: ${status.error_message}`);
          }
        },
        error: (error) => {
          console.error('Error checking status:', error);
          clearInterval(interval);
        }
      });
    }, 5000); // Check cada 5 segundos
  }

  // ==================== GETTERS ====================

  get currentVideo(): Video | undefined {
    return this.videos[this.currentVideoIndex];
  }

  get hasVideos(): boolean {
    return this.videos.length > 0;
  }

  // ==================== FALLBACK MOCK DATA ====================

  private loadMockVideos() {
    console.warn('Cargando datos MOCK (sin conexion al backend)');

    this.videos = [
      {
        id: 1,
        uuid: 'mock-vid-001',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
        title: 'Video de Prueba #1',
        description: 'Este es un video de prueba mientras el backend se conecta',
        duration: 45,
        views_count: 1250,
        likes_count: 89,
        comments_count: 23,
        shares_count: 12,
        saves_count: 45,
        original_language: 'es',
        available_languages: ['es', 'en'],
        processing_status: 'ready',
        is_public: true,
        is_liked: false,
        is_saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 1,
        user: {
          id: 1,
          username: 'test_user',
          full_name: 'Usuario de Prueba',
          profile_picture_url: 'https://ui-avatars.com/api/?name=Test+User',
          is_verified: true
        }
      } as Video
    ];
  }
}
