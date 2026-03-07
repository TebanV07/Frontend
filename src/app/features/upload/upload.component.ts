import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UploadService, UploadResponse } from '../../core/services/upload.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  file?: File;
  previewUrl?: string;
  title: string = '';
  description: string = '';
  isSubmitting = false;
  error: string | null = null;

  constructor(
    private uploadService: UploadService,
    private router: Router
  ) {}

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      this.previewUrl = URL.createObjectURL(this.file);
    }
  }

  submit(): void {
    if (!this.file) {
      this.error = 'Por favor selecciona un archivo';
      return;
    }
    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('file', this.file, this.file.name);
    if (this.title) formData.append('title', this.title);
    if (this.description) formData.append('description', this.description);

    this.uploadService.upload(formData).subscribe({
      next: (res: UploadResponse) => {
        if (res.content_type === 'video' && res.id) {
          this.router.navigate([`/videos/${res.id}`]);
        } else if (res.content_type === 'post' && res.id) {
          this.router.navigate([`/posts/${res.id}/edit`]);
        } else if (res.redirect_to) {
          this.router.navigate([res.redirect_to]);
        }
      },
      error: (err: any) => {
        console.error('Upload failed', err);
        this.error = 'Error al subir el archivo';
        this.isSubmitting = false;
      }
    });
  }
}
