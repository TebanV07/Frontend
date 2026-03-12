import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PostsService } from '../../../../core/services/posts.service';
import { Post } from '../../../../core/models/post.model';
import { LikeButtonComponent } from '../../likes/likes-button/likes-button.component';
import { LikeCountComponent } from '../../likes/likes-count/likes-count.component';
import { CommentListComponent } from '../../comments/comment-list/comment-list.component';
import { FlagService } from '../../../../core/services/flag.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LikeButtonComponent,
    LikeCountComponent,
    CommentListComponent,
    FormsModule, TranslateModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss']
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  isLoading = true;
  error: string | null = null;
  currentUserId?: number;

  showTranslation = false;
  translatedContent = '';
  isTranslating = false;
  selectedTranslationLanguage = 'en';

  private readonly apiBaseUrl = 'http://localhost:8001';

  constructor(
    private route: ActivatedRoute,
    private postService: PostsService,
    public flagService: FlagService    // â­ NUEVO
  ) {}

  ngOnInit(): void {
    const postId = this.route.snapshot.params['id'];
    this.loadPost(postId);
  }

  loadPost(id: string): void {
    this.isLoading = true;
    this.postService.getPostById(id).subscribe({
      next: (post) => { this.post = post; this.isLoading = false; },
      error: () => { this.error = 'Failed to load post'; this.isLoading = false; }
    });
  }

  getFullImageUrl(imageUrl: string | undefined | null): string {
    if (!imageUrl) return '';
    return imageUrl.startsWith('http') ? imageUrl : `${this.apiBaseUrl}${imageUrl}`;
  }

  getFullVideoUrl(videoUrl: string | undefined | null): string {
    if (!videoUrl) return '';
    return videoUrl.startsWith('http') ? videoUrl : `${this.apiBaseUrl}${videoUrl}`;
  }

  onVideoError(event: Event): void {
    console.error('âŒ Error loading video:', (event.target as HTMLVideoElement)?.error);
  }

  toggleTranslation(): void {
    if (!this.post) return;
    if (this.showTranslation) { this.showTranslation = false; return; }

    this.isTranslating = true;
    this.postService.translatePost(this.post.id, this.selectedTranslationLanguage).subscribe({
      next: (res: any) => {
        this.translatedContent = res?.translated_content ?? res?.content ?? '';
        this.showTranslation = true;
        this.isTranslating = false;
      },
      error: () => {
        this.translatedContent = `[Simulated] ${this.post?.content}`;
        this.showTranslation = true;
        this.isTranslating = false;
      }
    });
  }

  onLikeToggled(event: { isLiked: boolean; likesCount: number }): void {
    if (this.post) {
      this.post.is_liked = event.isLiked;
      this.post.likes_count = event.likesCount;
    }
  }

  get formattedDate(): string {
    if (!this.post) return '';
    return new Date(this.post.created_at as string).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}

