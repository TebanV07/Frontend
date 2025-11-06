import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Post, PostsService } from '../../../core/services/posts.service'; 

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent {
  postContent = '';
  isPosting = false;

  // 👇 Nuevo Output
  @Output() postCreated = new EventEmitter<Post>();
  

  constructor(private postsService: PostsService) {}

  onShare() {
    if (!this.postContent.trim()) return;

    this.isPosting = true;

    const postData = {
      content: this.postContent.trim(),
      target_language: 'en'
    };

    this.postsService.createPost(postData).subscribe({
      next: (response) => {
        this.postCreated.emit(response.post || response);
        console.log('✅ Post creado:', response);
        this.postContent = '';
        this.isPosting = false;

        // 👇 Emitir evento al FeedComponent
        this.postCreated.emit();
      },
      error: (error) => {
        console.error('❌ Error al crear post:', error);
        this.isPosting = false;
      }
    });
  }
}
