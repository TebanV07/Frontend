import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PostsService } from '../../../../core/services/posts.service';
import { Post } from '../../../../core/models/post.model';
import { LikeButtonComponent } from '../../likes/likes-button/likes-button.component';
import { LikeCountComponent } from '../../likes/likes-count/likes-count.component';
import { CommentListComponent } from '../../comments/comment-list/comment-list.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LikeButtonComponent, 
    LikeCountComponent,
    CommentListComponent
  ],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss']
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  isLoading = true;
  error: string | null = null;
  currentUserId?: number; // TODO: Obtener del auth service

  constructor(
    private route: ActivatedRoute,
    private postService: PostsService
  ) {}

  ngOnInit(): void {
    const postId = this.route.snapshot.params['id'];
    this.loadPost(postId);
  }

  loadPost(id: string): void {
  this.isLoading = true;
  this.postService.getPostById(id).subscribe({
    next: (post) => {
      this.post = post;
      this.isLoading = false;
    },
    error: (error) => {
      this.error = 'Failed to load post';
      this.isLoading = false;
      console.error('Error loading post:', error);
    }
  });
}

  onLikeToggled(event: { isLiked: boolean; likesCount: number }): void {
    if (this.post) {
      this.post.is_liked = event.isLiked;
      this.post.likes_count = event.likesCount;
    }
  }

  get formattedDate(): string {
    if (!this.post) return '';
    
    const date = new Date(this.post.created_at);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
