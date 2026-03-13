import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Comment } from '../../../../core/models/comment.model';
import { CommentService } from '../../../../core/services/comment.service';
import { CommentFormComponent } from '../comment-form/comment-form.component';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentFormComponent, TranslateModule],
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss']
})
export class CommentItemComponent implements OnInit {
  @Input() comment!: Comment;
  @Input() postId?: number;
  @Input() videoId?: number;
  @Input() currentUserId?: number;
  @Input() isNested: boolean = false;
  @Output() replyCreated = new EventEmitter<Comment>();
  @Output() deleted = new EventEmitter<number>();

  isReplying: boolean = false;
  showReplies: boolean = false;
  formattedDate: string = '';
  showMenu = false;
  // edición
  isEditing: boolean = false;
  editContent: string = '';

  constructor(private commentService: CommentService) {}

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
  toggleMenu(event: Event): void {
  event.stopPropagation();
  this.showMenu = !this.showMenu;
}
  toggleReplyForm(): void {
    this.isReplying = !this.isReplying;
  }

startEdit(): void {
  if (this.currentUserId !== this.comment.user_id) return;
  this.showMenu = false;
  this.isEditing = true;
  this.editContent = this.comment.content;
}

  cancelEdit(): void {
    this.isEditing = false;
    this.editContent = '';
  }

  saveEdit(): void {
    if (!this.editContent.trim()) return;
    // elegir endpoint según contexto
    const update$ = this.videoId
      ? this.commentService.updateVideoComment(this.comment.id, { content: this.editContent.trim() })
      : this.commentService.updatePostComment(this.comment.id, { content: this.editContent.trim() });
    update$.subscribe({
        next: (updated) => {
          this.comment.content = updated.content;
          this.comment.is_edited = true;
          this.isEditing = false;
        },
        error: (err: any) => console.error('Error editing comment', err)
      });
  }

deleteThisComment(): void {
  if (this.currentUserId !== this.comment.user_id) return;
  this.showMenu = false;
  if (!confirm('¿Eliminar este comentario?')) return;
  const delete$ = this.videoId
    ? this.commentService.deleteVideoComment(this.comment.id)
    : this.commentService.deletePostComment(this.comment.id);
  delete$.subscribe({
    next: () => this.deleted.emit(this.comment.id),
    error: (err: any) => console.error('Error deleting comment', err)
  });
}
@HostListener('document:click')
onDocumentClick(): void {
  this.showMenu = false;
}

  toggleReplies(): void {
    this.showReplies = !this.showReplies;
  }

  get hasReplies(): boolean {
    return (this.comment.replies_count || 0) > 0;
  }

  toggleCommentLike(): void {
    if (this.comment.is_liked) {
      // usar método según contexto de post o video
      const unlike$ = this.videoId
        ? this.commentService.unlikeVideoComment(this.comment.id)
        : this.commentService.unlikePostComment(this.comment.id);
      unlike$.subscribe({
        next: () => {
          this.comment.is_liked = false;
          this.comment.likes_count = (this.comment.likes_count || 1) - 1;
        },
        error: (error: any) => {
          console.error('Error unliking comment:', error);
        }
      });
    } else {
      const like$ = this.videoId
        ? this.commentService.likeVideoComment(this.comment.id)
        : this.commentService.likePostComment(this.comment.id);
      like$.subscribe({
        next: () => {
          this.comment.is_liked = true;
          this.comment.likes_count = (this.comment.likes_count || 0) + 1;
        },
        error: (error: any) => {
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



