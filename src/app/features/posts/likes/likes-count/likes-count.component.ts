import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostLikeService } from '../../../../core/services/post-like.service';
import { LikeUser } from '../../../../core/models/like.model';

@Component({
  selector: 'app-like-count',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './likes-count.component.html',
  styleUrls: ['./likes-count.component.scss']
})
export class LikeCountComponent implements OnInit {
  @Input() postId!: number;
  @Input() likesCount: number = 0;
  @Input() clickable: boolean = true;

  showModal = false;
  likers: LikeUser[] = [];
  isLoadingLikers = false;

  constructor(private likeService: PostLikeService) {}

  ngOnInit(): void {}

  openLikersModal(): void {
    if (!this.clickable || this.likesCount === 0) return;

    this.showModal = true;
    this.loadLikers();
  }

  closeLikersModal(): void {
    this.showModal = false;
    this.likers = [];
  }

  loadLikers(): void {
    this.isLoadingLikers = true;
    this.likeService.getLikers(this.postId).subscribe({
      next: (users) => {
        this.likers = users;
        this.isLoadingLikers = false;
      },
      error: (error) => {
        console.error('Error loading likers:', error);
        this.isLoadingLikers = false;
      }
    });
  }
}
