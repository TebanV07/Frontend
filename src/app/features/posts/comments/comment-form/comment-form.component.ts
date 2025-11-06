import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostCommentService } from '../../../../core/services/post-comment.service';
import { CreateCommentDto, CommentResponse } from '../../../../core/models/comment.model';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-form.component.html',
  styleUrls: ['./comment-form.component.scss']
})
export class CommentFormComponent {
  @Input() postId!: number;
  @Input() parentCommentId?: number;
  @Input() placeholder: string = 'Write a comment...';
  @Input() autoFocus: boolean = false;
  @Output() commentCreated = new EventEmitter<CommentResponse>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  content: string = '';
  isSubmitting: boolean = false;
  error: string | null = null;

  constructor(private commentService: PostCommentService) {}

  ngAfterViewInit(): void {
    if (this.autoFocus && this.textarea) {
      setTimeout(() => this.textarea.nativeElement.focus(), 100);
    }
  }

  onSubmit(): void {
    if (!this.content.trim() || this.isSubmitting) return;

    this.isSubmitting = true;
    this.error = null;

    const commentData: CreateCommentDto = {
      content: this.content.trim(),
      parent_comment_id: this.parentCommentId
    };

    this.commentService.createComment(this.postId, commentData).subscribe({
      next: (response) => {
        this.commentCreated.emit(response);
        this.content = '';
        this.isSubmitting = false;
      },
      error: (error) => {
        this.error = error.error?.detail || 'Failed to post comment';
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.content = '';
    this.cancelled.emit();
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}