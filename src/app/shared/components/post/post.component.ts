// post.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../../core/models/post.model';
import { PostsService } from '../../../core/services/posts.service';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { FormsModule } from '@angular/forms';

// Importa los componentes de features
import { CommentFormComponent } from '../../../features/posts/comments/comment-form/comment-form.component';
import { CommentListComponent } from '../../../features/posts/comments/comment-list/comment-list.component';
import { LikeButtonComponent } from '../../../features/posts/likes/likes-button/likes-button.component';
import { LikeCountComponent } from '../../../features/posts/likes/likes-count/likes-count.component';
@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CommentFormComponent,
    CommentListComponent,
    LikeButtonComponent,
    LikeCountComponent
  ],
})
export class PostComponent implements OnInit {
  @Input() post!: Post;
  showComments = false;
  comments: Comment[] = [];
  loadingComments = false;

  // Para el currentUserId - reemplaza con tu lógica real de autenticación
  currentUserId: number = 1; // Esto debería venir de tu servicio de auth

  constructor(
    private postsService: PostsService,
    private commentService: CommentService
  ) {}

  ngOnInit(): void {}

  // ----------------------------
  // LIKES EN POSTS - CORREGIDO
  // ----------------------------
  onLikeToggled(event: { isLiked: boolean; likesCount: number }): void {
    console.log('✅ Like toggled:', event);
    this.post.isLiked = event.isLiked;
    this.post.likes_count = event.likesCount;
  }
  // ----------------------------
  // COMENTARIOS
  // ----------------------------
  toggleComments(): void {
    if (!this.post?.id) {
    console.error('❌ Cannot load comments: post.id is undefined', this.post);
    return;
  }
    this.showComments = !this.showComments;
  }

  // ----------------------------
  // MANEJADORES DE EVENTOS DE COMMENT-LIST
  // ----------------------------
  onCommentCreated(comment: Comment): void {
    // El comment-list ya maneja esto internamente, pero podemos actualizar el contador
    this.post.comments_count++;
  }

  // ----------------------------
  // MANEJADORES DE EVENTOS DE COMMENT-FORM
  // ----------------------------
  onCommentFormCreated(comment: Comment): void {
    // Este evento se emite cuando se crea un comentario desde el comment-form
    this.post.comments_count++;
  }

  onCommentFormCancelled(): void {
    // No necesitamos hacer nada cuando se cancela
    console.log('Comment creation cancelled');
  }

  // ----------------------------
  // LIKES EN COMENTARIOS
  // ----------------------------
  // NOTA: Los likes en comentarios ahora los maneja el comment-list internamente
  // a través del PostCommentService

  // ----------------------------
  // UTILIDADES
  // ----------------------------
  getRelativeTime(date: string): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  }
  // Agrega este método en post.component.ts

getLanguageName(code: string): string {
  const languages: { [key: string]: string } = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'zh': '中文',
    'ja': '日本語',
    'ko': '한국어',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'nl': 'Nederlands',
    'pl': 'Polski',
    'tr': 'Türkçe',
    // Agrega más según necesites
  };
  return languages[code] || code.toUpperCase();
}
}