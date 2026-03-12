import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PostComponent } from '../../../../shared/components/post/post.component';
import { CreatePostComponent } from '../../../../shared/components/create-post/create-post.component';
import { PostsService, Post } from '../../../../core/services/posts.service';
import { PostLikeService } from '../../../../core/services/post-like.service';
import { FollowService, FollowUser } from '../../../../core/services/follow.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostComponent, CreatePostComponent, NgFor, NgIf, CommonModule, RouterModule, TranslateModule],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  validPosts: Post[] = [];
  invalidPosts: any[] = [];
  isLoading = false;

  suggestedUsers: FollowUser[] = [];
  isLoadingUsers = false;
  followingUsers: { [key: number]: boolean } = {};
  isProcessingFollow: { [key: number]: boolean } = {};

  constructor(
    private postsService: PostsService,
    private likeService: PostLikeService,
    private followService: FollowService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPosts();
    this.loadSuggestedUsers();
  }

  loadPosts() {
    this.isLoading = true;

    this.postsService.getPosts().subscribe({
      next: (response) => {
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

        this.loadLikeStates();

        if (this.invalidPosts.length > 0) {
          console.warn('Posts invalidos ignorados en el feed:', this.invalidPosts);
        }
      },
      error: (error) => {
        console.error('Error al cargar posts:', error);
        this.posts = [];
        this.validPosts = [];
        this.invalidPosts = [];
        this.isLoading = false;
      }
    });
  }

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
      },
      error: (error) => {
        console.error('Error cargando estados de likes:', error);
        this.isLoading = false;
      }
    });
  }

  loadSuggestedUsers(): void {
    this.isLoadingUsers = true;

    this.followService.getSuggestedUsers(5).subscribe({
      next: (users) => {
        this.suggestedUsers = users;

        users.forEach(user => {
          this.followingUsers[user.id] = user.isFollowing || false;
          this.isProcessingFollow[user.id] = false;
        });

        this.isLoadingUsers = false;
      },
      error: (error) => {
        console.error('Error cargando usuarios sugeridos:', error);
        this.isLoadingUsers = false;
      }
    });
  }

  toggleFollowUser(user: FollowUser): void {
    if (this.isProcessingFollow[user.id]) {
      return;
    }

    this.isProcessingFollow[user.id] = true;
    const isCurrentlyFollowing = this.followingUsers[user.id];

    if (isCurrentlyFollowing) {
      this.followService.unfollowUser(user.id).subscribe({
        next: (response) => {
          if (!response?.error) {
            this.followingUsers[user.id] = false;
            user.isFollowing = false;
            setTimeout(() => this.loadSuggestedUsers(), 300);
          }
          this.isProcessingFollow[user.id] = false;
        },
        error: (error) => {
          console.error('Error al dejar de seguir:', error);
          this.isProcessingFollow[user.id] = false;
        }
      });
    } else {
      this.followService.followUser(user.id).subscribe({
        next: (response) => {
          if (response?.error) {
            console.warn(response.message);
            this.isProcessingFollow[user.id] = false;
            return;
          }

          if (response?.message?.includes('Ya sigues')) {
            this.followingUsers[user.id] = true;
            user.isFollowing = true;
            this.isProcessingFollow[user.id] = false;
            return;
          }

          this.followingUsers[user.id] = true;
          user.isFollowing = true;
          this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== user.id);
          setTimeout(() => this.loadSuggestedUsers(), 300);
          this.isProcessingFollow[user.id] = false;
        },
        error: (error) => {
          console.error('Error al seguir:', error);
          this.isProcessingFollow[user.id] = false;
        }
      });
    }
  }

navigateToProfile(username: string, event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  if (!username) {
    console.error('Nombre de usuario no definido');
    return;
  }

  this.router.navigate(['/profile', username]);
}

navigateToExplorePeople(): void {
  this.router.navigate(['/explore/people']);
}

  removeSuggestedUser(userId: number): void {
    this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== userId);
  }

  onPostCreated(payload: any) {
    if (!payload) {
      this.loadPosts();
      return;
    }

    if (payload.id && typeof payload.id === 'number' && payload.id > 0) {
      payload.isLiked = false;
      this.validPosts.unshift(payload);
      this.posts.unshift(payload);
    } else {
      console.error('Post creado invalido:', payload);
      this.loadPosts();
    }
  }

  /**
   * Maneja la subida de un video desde el componente de crear post.
   * Si la orientaciÃ³n NO es vertical automÃ¡ticamente genera un post
   * vinculado al video para que aparezca en el feed de posts.
   */
  onVideoCreated(video: any) {
    if (!video) return;

    // si el servidor ya creo un post, obtenerlo y agregarlo al feed
    if (video.content_type === 'post' && video.id) {
      this.postsService.getPostById(video.id).subscribe({
        next: (post) => {
          this.onPostCreated(post);
        },
        error: (err) => {
          console.error('No se pudo obtener el post creado:', err);
        }
      });
      return;
    }

    // si solo se creo un video (vertical), no hacemos nada en el feed de posts
    if (video.content_type === 'video') {
      return;
    }

    // de lo contrario quiza sea un objeto simple con id y orientation
    if (video.id && video.orientation && video.orientation !== 'vertical') {
      // intentar crear post fallback
      this.postsService.createPost({ content: '', video_id: video.id }).subscribe({
        next: (resp) => {
          if (resp && (resp as any).id) {
            this.onPostCreated(resp);
          }
        },
        error: (err) => {
          console.error('Error creando post fallback:', err);
        }
      });
    }
  }

  onTranslatePost(postId: number) {
    console.debug('Traducir texto del post:', postId);
  }

  onTranslateVideo(postId: number) {
    console.debug('Traducir video del post:', postId);
  }
}

