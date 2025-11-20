import { Component, OnInit } from '@angular/core';
import { PostComponent } from '../../../../shared/components/post/post.component';
import { CreatePostComponent } from '../../../../shared/components/create-post/create-post.component';
import { PostsService, Post } from '../../../../core/services/posts.service';
import { PostLikeService } from '../../../../core/services/post-like.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostComponent, CreatePostComponent, NgFor, NgIf, CommonModule],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  validPosts: Post[] = [];
  invalidPosts: any[] = [];
  isLoading = false;

  constructor(
    private postsService: PostsService,
    private likeService: PostLikeService
  ) {}

  ngOnInit() {
    this.loadPosts();
  }

  // 📦 Cargar posts
  loadPosts() {
    this.isLoading = true;

    this.postsService.getPosts().subscribe({
      next: (response) => {
        console.log('📝 Raw API Response:', response);

        const items = Array.isArray(response)
          ? response
          : (response as any)?.posts ??
            (response as any)?.results ??
            (response as any)?.data ??
            response ??
            [];

        this.posts = Array.isArray(items) ? items.filter((p: any) => !!p) : [];

        this.validPosts = this.posts.filter(
          (post) =>
            post &&
            post.id != null &&
            typeof post.id === 'number' &&
            post.id > 0
        );

        this.invalidPosts = this.posts.filter(
          (post) =>
            !post || post.id == null || typeof post.id !== 'number' || post.id <= 0
        );

        // ✅ Cargar estado de likes
        this.loadLikeStates();

        console.log('🔍 Valid posts:', this.validPosts.length);
        console.log('🚨 Invalid posts:', this.invalidPosts.length);

        if (this.invalidPosts.length > 0) {
          console.error('❌ Posts inválidos encontrados:', this.invalidPosts);
        }
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

  // ❤️ Cargar estado de likes
  loadLikeStates(): void {
    if (this.validPosts.length === 0) {
      this.isLoading = false;
      return;
    }

    const likeChecks = this.validPosts.map((post) =>
      this.likeService.checkIfLiked(post.id)
    );

    forkJoin(likeChecks).subscribe({
      next: (results) => {
        results.forEach((result, index) => {
          this.validPosts[index].is_liked = result.is_liked;
        });
        this.isLoading = false;
        console.log('✅ Posts con estado de likes cargado');
      },
      error: (error) => {
        console.error('❌ Error cargando estados de likes:', error);
        this.isLoading = false;
      }
    });
  }

  // 🆕 Cuando se crea un nuevo post
  onPostCreated(payload: any) {
    if (!payload) {
      this.loadPosts();
      return;
    }

    if (payload.id && typeof payload.id === 'number' && payload.id > 0) {
      payload.isLiked = false; // nuevo post sin like
      this.validPosts.unshift(payload);
      this.posts.unshift(payload);
    } else {
      console.error('❌ Post creado inválido:', payload);
      this.loadPosts();
    }
  }

  // 🌐 Cuando el post emite traducción de texto
  onTranslatePost(postId: number) {
    console.log('🌐 Traducir texto del post:', postId);
    // Aquí podrías luego invocar un servicio real:
    // this.postsService.translatePost(postId).subscribe(...)
  }

  // 🌐 Cuando el post emite traducción de video
  onTranslateVideo(postId: number) {
    console.log('🎥 Traducir video del post:', postId);
    // Similar: podrías usar un servicio para traducir el video
  }
}
