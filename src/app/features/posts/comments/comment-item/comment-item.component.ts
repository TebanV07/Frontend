import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comment } from '../../../../core/models/comment.model';
import { PostCommentService } from '../../../../core/services/post-comment.service';
import { CommentFormComponent } from '../comment-form/comment-form.component';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, CommentFormComponent],
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss']
})
export class CommentItemComponent implements OnInit {
  @Input() comment!: Comment;
  @Input() postId!: number;
  @Input() currentUserId?: number;
  @Input() isNested: boolean = false;
  @Output() replyCreated = new EventEmitter<Comment>();

  isReplying: boolean = false;
  showReplies: boolean = false;
  formattedDate: string = '';

  constructor(private commentService: PostCommentService) {}

  ngOnInit(): void {
    this.formatDate();
  }

  formatDate(): void {
    const date = new Date(this.comment.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      this.formattedDate = 'Just now';
    } else if (diffMins < 60) {
      this.formattedDate = `${diffMins}m ago`;
    } else if (diffHours < 24) {
      this.formattedDate = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      this.formattedDate = `${diffDays}d ago`;
    } else {
      this.formattedDate = date.toLocaleDateString();
    }
  }

  toggleReplyForm(): void {
    this.isReplying = !this.isReplying;
  }

  toggleReplies(): void {
    this.showReplies = !this.showReplies;
  }

  get hasReplies(): boolean {
    return (this.comment.replies_count || 0) > 0;
  }

  toggleCommentLike(): void {
    if (this.comment.is_liked) {
      this.commentService.unlikeComment(this.comment.id).subscribe({
        next: () => {
          this.comment.is_liked = false;
          this.comment.likes_count = (this.comment.likes_count || 1) - 1;
        },
        error: (error) => {
          console.error('Error unliking comment:', error);
        }
      });
    } else {
      this.commentService.likeComment(this.comment.id).subscribe({
        next: () => {
          this.comment.is_liked = true;
          this.comment.likes_count = (this.comment.likes_count || 0) + 1;
        },
        error: (error) => {
          console.error('Error liking comment:', error);
        }
      });
    }
  }

  onReplyCreated(reply: Comment): void {
    if (!this.comment.replies) {
      this.comment.replies = [];
    }
    this.comment.replies.unshift(reply);
    this.comment.replies_count = (this.comment.replies_count || 0) + 1;
    this.isReplying = false;
    this.showReplies = true;
    this.replyCreated.emit(reply);
  }
}