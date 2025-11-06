import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Post } from '../../../../core/models/post.model';
import { LikeButtonComponent } from '../../likes/likes-button/likes-button.component';
import { LikeCountComponent } from '../../likes/likes-count/likes-count.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, LikeButtonComponent, LikeCountComponent],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent {
  @Input() post!: Post;
  @Input() currentUserId?: number;
  @Output() postDeleted = new EventEmitter<number>();
  @Output() postUpdated = new EventEmitter<Post>();

  showDropdown = false;

  get isOwnPost(): boolean {
    return this.currentUserId === this.post.user_id;
  }

  get formattedDate(): string {
    const date = new Date(this.post.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  onLikeToggled(event: { isLiked: boolean; likesCount: number }): void {
    this.post.isLiked = event.isLiked;
    this.post.likes_count = event.likesCount;
  }

  editPost(): void {
    // TODO: Implementar edición
    console.log('Edit post:', this.post.id);
    this.showDropdown = false;
  }

  deletePost(): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postDeleted.emit(this.post.id);
    }
    this.showDropdown = false;
  }

  sharePost(): void {
    // TODO: Implementar compartir
    console.log('Share post:', this.post.id);
  }
}