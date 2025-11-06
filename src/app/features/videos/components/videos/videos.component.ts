import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoService, Video } from '../../../../core/services/video.service';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './videos.component.html',
  styleUrl: './videos.component.scss'
})
export class VideosComponent implements OnInit {
  videos: Video[] = [];
  currentVideoIndex = 0;
  showTranslation = false;
  isPlaying = false;
  isMuted = false;

  constructor(private videoService: VideoService) {}

  ngOnInit() {
    this.videoService.getVideos().subscribe(videos => {
      this.videos = videos;
      if (videos.length > 0) {
        this.videoService.setCurrentVideo(videos[0]);
      }
    });
  }

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
    if (this.currentVideoIndex < this.videos.length - 1) {
      this.currentVideoIndex++;
      this.videoService.setCurrentVideo(this.videos[this.currentVideoIndex]);
      this.showTranslation = false;
    }
  }

  previousVideo() {
    if (this.currentVideoIndex > 0) {
      this.currentVideoIndex--;
      this.videoService.setCurrentVideo(this.videos[this.currentVideoIndex]);
      this.showTranslation = false;
    }
  }

  toggleLike(video: Video) {
    this.videoService.toggleLike(video.id).subscribe();
  }

  toggleBookmark(video: Video) {
    this.videoService.toggleBookmark(video.id).subscribe();
  }

  toggleTranslation() {
    this.showTranslation = !this.showTranslation;
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  shareVideo(video: Video) {
    console.log('Sharing video:', video.id);
  }

  openComments(video: Video) {
    console.log('Opening comments for:', video.id);
  }

  followUser(user: any) {
    console.log('Following user:', user.username);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  get currentVideo(): Video | null {
    return this.videos[this.currentVideoIndex] || null;
  }
}