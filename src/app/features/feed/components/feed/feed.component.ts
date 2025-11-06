import { Component, OnInit } from '@angular/core';
import { PostComponent } from '../../../../shared/components/post/post.component';
import { CreatePostComponent } from '../../../../shared/components/create-post/create-post.component';
import { PostsService, Post } from '../../../../core/services/posts.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';

export type GetPostsResponse =
  | Post[]
  | { posts?: Post[] }
  | { results?: Post[] }
  | { data?: Post[] }
  | { count?: number; results?: Post[] };

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostComponent, CreatePostComponent, NgFor, NgIf, CommonModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  validPosts: Post[] = [];    // ✅ Posts con ID válido
  invalidPosts: any[] = [];   // ✅ Posts sin ID (para debug)
  isLoading = false;

  constructor(private postsService: PostsService) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
  this.isLoading = true;
  this.postsService.getPosts().subscribe({
    next: (response) => {
      console.log('📝 Raw API Response:', response);
      
      const items = Array.isArray(response)
        ? response
        : (response as any)?.posts ?? (response as any)?.results ?? (response as any)?.data ?? response ?? [];
      
      // ✅ FILTRADO MUY ESTRICTO
      this.posts = Array.isArray(items) 
        ? items.filter((p: any) => !!p)
        : [];
      
      // ✅ SEPARAR POSTS VÁLIDOS E INVÁLIDOS (CORREGIDO)
      this.validPosts = this.posts.filter(post => 
        post && 
        post.id != null &&
        typeof post.id === 'number' &&
        post.id > 0
      );
      
      this.invalidPosts = this.posts.filter(post => 
        !post || 
        post.id == null ||
        typeof post.id !== 'number' ||
        post.id <= 0  
      );
      
      console.log('🔍 Valid posts:', this.validPosts.length);
      console.log('🚨 Invalid posts:', this.invalidPosts.length);
      
      if (this.invalidPosts.length > 0) {
        console.error('❌ Posts inválidos encontrados:', this.invalidPosts);
      }
      
      this.isLoading = false;
    },
    error: (error) => {
      console.error('❌ Error al cargar posts:', error);
      this.posts = [];
      this.validPosts = [];
      this.invalidPosts = [];
      this.isLoading = false;
    }
  });
}

  onPostCreated(payload: any) {
    if (!payload) {
      this.loadPosts();
      return;
    }
    
    // ✅ Validar el nuevo post antes de agregarlo
    if (payload.id && typeof payload.id === 'number' && payload.id > 0) {
      this.validPosts.unshift(payload);
      this.posts.unshift(payload);
    } else {
      console.error('❌ Post creado inválido:', payload);
      this.loadPosts(); // Recargar como fallback
    }
  }

  onTranslateVideo(postId: string) {
    console.log('🌐 Traducir video del post:', postId);
  }
}