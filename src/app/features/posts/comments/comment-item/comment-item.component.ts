import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comment, UpdateCommentDto } from '../../../../core/models/comment.model';
import { PostCommentService } from '../../../../core/services/post-comment.service';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, CommentFormComponent, FormsModule],
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss']
})
export class CommentItemComponent {
  @Input() comment!: Comment;
  @Input() postId!: number;
  @Input() currentUserId?: number;
  @Output() commentDeleted = new EventEmitter<number>();
  @Output() commentUpdated = new EventEmitter<Comment>();
  @Output() replyCreated = new EventEmitter<Comment>();

  isEditing: boolean = false;
  isReplying: boolean = false;
  showReplies: boolean = false;
  editContent: string = '';
  isDeleting: boolean = false;

  constructor(private commentService: PostCommentService) {}

  get isOwnComment(): boolean {
    return this.currentUserId === this.comment.user_id;
  }

  get hasReplies(): boolean {
    return (this.comment.replies_count || 0) > 0;
  }

  get formattedDate(): string {
    const date = new Date(this.comment.created_at);
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

  startEditing(): void {
    this.editContent = this.comment.content;
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editContent = '';
  }

  saveEdit(): void {
    if (!this.editContent.trim()) return;

    const updateData: UpdateCommentDto = {
      content: this.editContent.trim()
    };

    this.commentService.updateComment(this.comment.id, updateData).subscribe({
      next: (response) => {
        this.comment.content = response.content;
        this.comment.updated_at = response.updated_at;
        this.isEditing = false;
        this.commentUpdated.emit(this.comment);
      },
      error: (error) => {
        console.error('Error updating comment:', error);
      }
    });
  }

  deleteComment(): void {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.isDeleting = true;
    this.commentService.deleteComment(this.comment.id).subscribe({
      next: () => {
        this.commentDeleted.emit(this.comment.id);
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        this.isDeleting = false;
      }
    });
  }

  toggleReplies(): void {
    this.showReplies = !this.showReplies;
    
    if (this.showReplies && !this.comment.replies) {
      this.loadReplies();
    }
  }

  loadReplies(): void {
    this.commentService.getReplies(this.comment.id).subscribe({
      next: (replies) => {
        this.comment.replies = replies;
      },
      error: (error) => {
        console.error('Error loading replies:', error);
      }
    });
  }

  toggleReplyForm(): void {
    this.isReplying = !this.isReplying;
  }

  onReplyCreated(reply: Comment): void {
    if (!this.comment.replies) {
      this.comment.replies = [];
    }
    this.comment.replies.push(reply);
    this.comment.replies_count = (this.comment.replies_count || 0) + 1;
    this.isReplying = false;
    this.showReplies = true;
    this.replyCreated.emit(reply);
  }
}
