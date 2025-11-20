import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
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
  @Output() postCreated = new EventEmitter<Post>();
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput') videoInput!: ElementRef<HTMLInputElement>;

  postContent = '';
  isPosting = false;
  
  // Múltiples imágenes (NUEVO)
  selectedImages: File[] = [];
  imagePreviews: string[] = [];
  
  // Mantener compatibilidad con código viejo
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  
  // Video
  selectedVideo: File | null = null;
  videoPreview: string | null = null;
  
  mediaType: 'images' | 'video' | null = null;

  constructor(private postsService: PostsService) {}

  // Abrir selector de imágenes
  onSelectImages() {
    this.imageInput.nativeElement.click();
  }

  // Abrir selector de video
  onSelectVideo() {
    this.videoInput.nativeElement.click();
  }

  // Manejar selección de MÚLTIPLES imágenes
  onImagesSelected(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    
    if (files.length === 0) return;
    
    // Validar que sean imágenes
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('Please select only image files');
      return;
    }
    
    // Validar que no superen 10 imágenes
    const totalImages = this.selectedImages.length + files.length;
    if (totalImages > 10) {
      alert('Maximum 10 images allowed');
      return;
    }
    
    // Validar tamaño de cada imagen (max 10MB)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Each image must be less than 10MB');
      return;
    }
    
    // Remover video si había
    this.selectedVideo = null;
    this.videoPreview = null;
    this.mediaType = 'images';
    
    // Agregar nuevas imágenes
    files.forEach(file => {
      this.selectedImages.push(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  // Remover una imagen específica
  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
    
    if (this.selectedImages.length === 0) {
      this.mediaType = null;
    }
  }

  // Manejar selección de video
  onVideoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    // Validar tamaño (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('Video size must be less than 100MB');
      return;
    }

    // Remover imágenes si había
    this.selectedImages = [];
    this.imagePreviews = [];
    
    this.selectedVideo = file;
    this.mediaType = 'video';

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.videoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Remover video
  removeVideo() {
    this.selectedVideo = null;
    this.videoPreview = null;
    this.mediaType = null;
    
    if (this.videoInput) {
      this.videoInput.nativeElement.value = '';
    }
  }

  // Remover todo el media
  removeAllMedia() {
    this.selectedImages = [];
    this.imagePreviews = [];
    this.selectedVideo = null;
    this.videoPreview = null;
    this.mediaType = null;
    
    if (this.imageInput) {
      this.imageInput.nativeElement.value = '';
    }
    if (this.videoInput) {
      this.videoInput.nativeElement.value = '';
    }
  }

  // Compartir post
  onShare() {
  console.log('🔵 onShare() llamado');
  console.log('📝 Content:', this.postContent);
  console.log('🖼️ Images:', this.selectedImages.length);
  console.log('🎥 Video:', this.selectedVideo);
  
  if (!this.postContent.trim() && this.selectedImages.length === 0 && !this.selectedVideo) {
    alert('Please add some content, images or video');
    return;
  }

  this.isPosting = true;

  // Si hay video
  if (this.selectedVideo) {
    console.log('🎥 Creando video...');
    // ... código de video
  }
  // Si hay imágenes o contenido
  else {
    console.log('🖼️ Creando post con media...');
    console.log('📤 Enviando:', {
      content: this.postContent.trim(),
      images: this.selectedImages.length,
      language: 'en'
    });
    
    this.postsService.createPostWithMedia(
      this.postContent.trim(),
      this.selectedImages.length > 0 ? this.selectedImages : undefined,
      undefined,
      'en'
    ).subscribe({
      next: (response) => {
        console.log('✅ Post creado exitosamente:', response);
        this.resetForm();
        this.postCreated.emit(response);
      },
      error: (error) => {
        console.error('❌ Error completo:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Error body:', error.error);
        alert('Error creating post. Please try again.');
        this.isPosting = false;
      }
    });
  }
}
  // Resetear formulario
  private resetForm() {
    this.postContent = '';
    this.removeAllMedia();
    this.isPosting = false;
  }
}