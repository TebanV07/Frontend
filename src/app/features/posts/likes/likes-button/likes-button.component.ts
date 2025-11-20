import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostLikeService } from '../../../../core/services/post-like.service';

@Component({
  selector: 'app-like-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './likes-button.component.html',
  styleUrls: ['./likes-button.component.scss']
})
export class LikeButtonComponent {
  @Input() postId!: number;
  @Input() is_liked: boolean = false;
  @Input() likesCount: number = 0;
  @Output() likeToggled = new EventEmitter<{ is_liked: boolean; likesCount: number }>();

  isLoading = false;

  constructor(private likeService: PostLikeService) {}

  toggleLike(): void {
  if (this.isLoading) return;

  this.isLoading = true;

  // ✅ PASA is_liked al servicio
  this.likeService.toggleLike(this.postId, this.is_liked).subscribe({
    next: (response) => {
      // Toggle manual ya que el backend no devuelve el estado
      this.is_liked = !this.is_liked;
      this.likesCount = this.is_liked ? this.likesCount + 1 : this.likesCount - 1;
      this.likeToggled.emit({ 
        is_liked: this.is_liked, 
        likesCount: this.likesCount 
      });
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error toggling like:', error);
      this.isLoading = false;
    }
  });
 }
}