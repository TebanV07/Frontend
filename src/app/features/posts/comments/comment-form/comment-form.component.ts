import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService } from '../../../../core/services/comment.service';
import { CreateCommentDto, CommentResponse } from '../../../../core/models/comment.model';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-form.component.html',
  styleUrls: ['./comment-form.component.scss']
})
export class CommentFormComponent implements AfterViewInit {
  @Input() postId?: number;
  @Input() videoId?: number;
  @Input() parentCommentId?: number;
  @Input() placeholder: string = 'Write a comment...';
  @Input() autoFocus: boolean = false;
  @Output() commentCreated = new EventEmitter<CommentResponse>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  content: string = '';
  isSubmitting: boolean = false;
  error: string | null = null;

  constructor(private commentService: CommentService) {}

  ngAfterViewInit(): void {
    if (this.autoFocus && this.textarea) {
      setTimeout(() => this.textarea.nativeElement.focus(), 100);
    }
  }

  onSubmit(): void {
    if (!this.content.trim() || this.isSubmitting) return;

    this.isSubmitting = true;
    this.error = null;

    const data: CreateCommentDto = {
      content: this.content.trim(),
      parent_comment_id: this.parentCommentId
    };

    const obs = this.videoId
      ? this.commentService.createVideoComment(this.videoId, data)
      : this.commentService.createComment(this.postId || 0, data);

    obs.subscribe({
      next: (response) => {
        this.commentCreated.emit(response as any);
        this.content = '';
        this.isSubmitting = false;
      },
      error: (error: any) => {
        this.error = error.error?.detail || 'Error al publicar el comentario';
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.content = '';
    this.error = null;
    this.cancelled.emit();
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
