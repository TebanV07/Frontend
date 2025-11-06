import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Video } from '../../../../core/models/video.model';
import { ShortNumberPipe } from "../../../../shared/pipes/short-number.pipe";

@Component({
  selector: 'app-video-overlay',
  standalone: true,
  imports: [CommonModule, ShortNumberPipe],
  templateUrl: './video-overlay.component.html',
  styleUrls: ['./video-overlay.component.scss']
})
export class VideoOverlayComponent {
  @Input() video!: Video;
  @Output() like = new EventEmitter<Video>();
  @Output() comment = new EventEmitter<Video>();
  @Output() share = new EventEmitter<Video>();

  onLike() {
    this.video.isLiked = !this.video.isLiked;
    this.video.likesCount += this.video.isLiked ? 1 : -1;
    this.like.emit(this.video);
  }

  onSave() {
    this.video.isSaved = !this.video.isSaved;
    this.video.savesCount += this.video.isSaved ? 1 : -1;
  }
}