import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Video } from '../../../../core/models/video.model';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements AfterViewInit {
  @Input() video!: Video;
  @Input() isPlaying = false;
  @Output() videoEnded = new EventEmitter<void>();

  private videoElement!: HTMLVideoElement;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    this.videoElement = this.elementRef.nativeElement.querySelector('video');
    this.setupVideo();
  }

  private setupVideo() {
    if (this.videoElement) {
      this.videoElement.addEventListener('ended', () => {
        this.videoEnded.emit();
      });
    }
  }

  togglePlay() {
    if (this.videoElement) {
      if (this.isPlaying) {
        this.videoElement.play();
      } else {
        this.videoElement.pause();
      }
    }
  }
}