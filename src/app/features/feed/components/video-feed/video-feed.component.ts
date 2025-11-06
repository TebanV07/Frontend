
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Video } from '../../../../core/models/video.model';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { VideoOverlayComponent } from '../video-overlay/video-overlay.component';

@Component({
  selector: 'app-video-feed',
  standalone: true,
  imports: [CommonModule, VideoPlayerComponent, VideoOverlayComponent],
  templateUrl: './video-feed.component.html',
  styleUrls: ['./video-feed.component.scss']
})
export class VideoFeedComponent implements OnInit {
onLike($event: Video) {
throw new Error('Method not implemented.');
}
onComment($event: Video) {
throw new Error('Method not implemented.');
}
onShare(video: Video) {
throw new Error('Method not implemented.');
}
  videos: Video[] = [];
  currentVideoIndex = 0;
  isPlaying = true;

  ngOnInit() {
    this.loadMockVideos();
  }

  loadMockVideos() {
    // Datos simulados basados en tu modelo
    this.videos = [
      {
        id: 1,
        uuid: 'vid-001',
        videoUrl: '/assets/videos/video1.mp4',
        thumbnailUrl: '/assets/thumbnails/thumb1.jpg',
        title: 'Mi primer video en Angular',
        description: 'Explorando las nuevas características',
        duration: 45,
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        fileSize: 10485760,
        format: 'mp4',
        userId: 1,
        user: {
          id: 1,
          username: 'maria_dev',
          avatar: '/assets/avatars/avatar1.jpg',
          bio: 'Desarrolladora Full Stack'
        } as any,
        originalLanguage: 'es',
        availableLanguages: ['es', 'en', 'fr'],
        hasSubtitles: true,
        hasAudioTranslation: false,
        likesCount: 1250,
        commentsCount: 89,
        sharesCount: 45,
        viewsCount: 15000,
        savesCount: 230,
        isLiked: false,
        isSaved: false,
        isPublic: true,
        isActive: true,
        isFeatured: true,
        tags: ['angular', 'tutorial', 'programming'],
        category: 'technology',
        createdAt: new Date('2024-01-15'),
        publishedAt: new Date('2024-01-15')
      },
      // Más videos simulados...
    ];
  }

  onVideoEnded() {
    if (this.currentVideoIndex < this.videos.length - 1) {
      this.currentVideoIndex++;
    }
  }

  onSwipe(direction: 'up' | 'down') {
    if (direction === 'up' && this.currentVideoIndex < this.videos.length - 1) {
      this.currentVideoIndex++;
    } else if (direction === 'down' && this.currentVideoIndex > 0) {
      this.currentVideoIndex--;
    }
  }

  get currentVideo(): Video {
    return this.videos[this.currentVideoIndex];
  }
}