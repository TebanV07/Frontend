import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostsService } from '../../../../core/services/posts.service';
import { Post } from '../../../../core/models/post.model';

@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './edit-post.component.html',
  styleUrls: ['./edit-post.component.scss']
})
export class EditPostComponent implements OnInit {
  post: Post | null = null;
  content = '';
  tagsText = '';
  isPublic = true;
  isLoading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postsService: PostsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadPost(id);
  }

  loadPost(id: string): void {
    this.isLoading = true;
    this.postsService.getPostById(id).subscribe({
      next: (p) => {
        this.post = p;
        this.content = p.content;
        this.tagsText = (p.tags || []).join(', ');
        this.isPublic = p.is_public;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el post';
        this.isLoading = false;
      }
    });
  }

  save(): void {
    if (!this.post) return;
    const tags = this.tagsText
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    this.postsService.updatePost(this.post.id.toString(), {
      content: this.content,
      tags: tags,
      is_public: this.isPublic
    }).subscribe({
      next: () => {
        this.router.navigate([`/posts/${this.post?.id}`]);
      },
      error: (err) => {
        console.error('Error updating post', err);
        this.error = 'Error al guardar';
      }
    });
  }

  skip(): void {
    if (this.post) {
      this.router.navigate([`/posts/${this.post.id}`]);
    }
  }
}

