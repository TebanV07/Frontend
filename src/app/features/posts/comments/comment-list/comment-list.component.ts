import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostCommentService } from '../../../../core/services/post-comment.service';
import { Comment } from '../../../../core/models/comment.model';
import { CommentItemComponent } from '../comment-item/comment-item.component';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [CommonModule, CommentItemComponent],
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  @Input() postId!: number;
  @Input() currentUserId?: number;

  comments: Comment[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  page: number = 1;
  hasMore: boolean = true;
  isLoadingMore: boolean = false;

  constructor(private commentService: PostCommentService) {}

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.isLoading = true;
    this.commentService.getComments(this.postId, this.page).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.hasMore = comments.length === 20;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load comments';
        this.isLoading = false;
        console.error('Error loading comments:', error);
      }
    });
  }

  loadMore(): void {
    if (this.isLoadingMore || !this.hasMore) return;

    this.page++;
    this.isLoadingMore = true;

    this.commentService.getComments(this.postId, this.page).subscribe({
      next: (comments) => {
        this.comments = [...this.comments, ...comments];
        this.hasMore = comments.length === 20;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more comments:', error);
        this.isLoadingMore = false;
        this.page--;
      }
    });
  }

  onCommentCreated(comment: Comment): void {
    this.comments.unshift(comment);
  }

  // Método para optimizar el rendering con trackBy
  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }
}