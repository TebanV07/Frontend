import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService } from '../../../../core/services/comment.service';
import { Comment } from '../../../../core/models/comment.model';
import { CommentItemComponent } from '../comment-item/comment-item.component';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentItemComponent],
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  @Input() postId?: number;
  @Input() videoId?: number;
  @Input() currentUserId?: number;
  @Output() commentCreated = new EventEmitter<Comment>();

  comments: Comment[] = [];
  isLoading = true;
  error: string | null = null;
  hasMore = true;
  isLoadingMore = false;
  private page = 0;

  // Nuevo comentario
  newCommentText = '';
  isSubmitting = false;

  constructor(private commentService: CommentService) {}

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.isLoading = true;
    const obs = this.videoId
      ? this.commentService.getVideoComments(this.videoId, 0, 20)
      : this.commentService.getComments(this.postId || 0, 0, 20);

    obs.subscribe({
      next: (comments) => {
        this.comments = comments;
        this.hasMore = comments.length === 20;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Error al cargar comentarios';
        this.isLoading = false;
      }
    });
  }

  loadMore(): void {
    if (this.isLoadingMore || !this.hasMore) return;
    this.page++;
    this.isLoadingMore = true;
    const skip = this.page * 20;

    const obs = this.videoId
      ? this.commentService.getVideoComments(this.videoId, skip, 20)
      : this.commentService.getComments(this.postId || 0, skip, 20);

    obs.subscribe({
      next: (comments) => {
        this.comments = [...this.comments, ...comments];
        this.hasMore = comments.length === 20;
        this.isLoadingMore = false;
      },
      error: () => { this.isLoadingMore = false; this.page--; }
    });
  }

  submitComment(): void {
    if (!this.newCommentText.trim() || this.isSubmitting) return;
    this.isSubmitting = true;

    const data = { content: this.newCommentText.trim() };
    const obs = this.videoId
      ? this.commentService.createVideoComment(this.videoId, data)
      : this.commentService.createComment(this.postId || 0, data);

    obs.subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.newCommentText = '';
        this.isSubmitting = false;
        this.commentCreated.emit(comment);
      },
      error: () => { this.isSubmitting = false; }
    });
  }

  onCommentDeleted(commentId: number): void {
    this.comments = this.comments.filter(c => c.id !== commentId);
  }

  trackByCommentId(_: number, comment: Comment): number {
    return comment.id;
  }
}
