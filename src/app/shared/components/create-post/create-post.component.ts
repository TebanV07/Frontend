import { Component, Output, EventEmitter, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Post, PostsService } from '../../../core/services/posts.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent implements OnInit {
  @Output() postCreated  = new EventEmitter<Post>();
  @Output() videoCreated = new EventEmitter<any>();

  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput') videoInput!: ElementRef<HTMLInputElement>;

  // ✅ Datos del usuario actual
  currentUser: any = null;
  readonly defaultAvatar = 'assets/default-avatar.png';

  postContent    = '';
  isPosting      = false;
  uploadProgress = 0;

  selectedImages: File[]   = [];
  imagePreviews:  string[] = [];

  selectedVideo:    File | null = null;
  videoPreview:     string | null = null;
  videoTitle        = '';
  videoDescription  = '';

  mediaType: 'images' | 'video' | null = null;

  constructor(
    private postsService: PostsService,
    private authService: AuthService   // ✅ Inyectado
  ) {}

  ngOnInit(): void {
    // ✅ Suscribirse al usuario actual para obtener avatar y idioma nativo
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  // ✅ Avatar real del usuario
  getAvatarUrl(): string {
    const avatar = this.currentUser?.avatar || this.currentUser?.profile_image;
    if (!avatar) return this.defaultAvatar;
    if (avatar.startsWith('http')) return avatar;
    return `http://localhost:8001${avatar}`;
  }

  onAvatarError(event: Event) {
    (event.target as HTMLImageElement).src = this.defaultAvatar;
  }

  // ✅ Idioma nativo del usuario (fallback a 'es')
  get userLanguage(): string {
    return this.currentUser?.native_language
      || this.currentUser?.nativeLanguage
      || 'es';
  }

  // ==================== SELECCIÓN DE MEDIA ====================

  onSelectImages() { this.imageInput.nativeElement.click(); }
  onSelectVideo()  { this.videoInput.nativeElement.click(); }

  // ==================== MANEJO DE IMÁGENES ====================

  onImagesSelected(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    if (files.length === 0) return;

    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) { alert('Por favor selecciona solo archivos de imagen'); return; }

    if (this.selectedImages.length + files.length > 10) { alert('Máximo 10 imágenes permitidas'); return; }

    const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) { alert('Cada imagen debe ser menor a 10MB'); return; }

    this.selectedVideo = null;
    this.videoPreview  = null;
    this.mediaType     = 'images';

    files.forEach(file => {
      this.selectedImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
    if (this.selectedImages.length === 0) this.mediaType = null;
  }

  // ==================== MANEJO DE VIDEO ====================

  onVideoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) { alert('Por favor selecciona un archivo de video válido'); return; }
    if (file.size > 100 * 1024 * 1024)  { alert('El video debe ser menor a 100MB'); return; }

    this.selectedImages = [];
    this.imagePreviews  = [];
    this.selectedVideo  = file;
    this.mediaType      = 'video';

    const reader = new FileReader();
    reader.onload = (e) => { this.videoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removeVideo() {
    this.selectedVideo   = null;
    this.videoPreview    = null;
    this.videoTitle      = '';
    this.videoDescription = '';
    this.mediaType       = null;
    this.uploadProgress  = 0;
    if (this.videoInput) this.videoInput.nativeElement.value = '';
  }

  removeAllMedia() {
    this.selectedImages  = [];
    this.imagePreviews   = [];
    this.selectedVideo   = null;
    this.videoPreview    = null;
    this.videoTitle      = '';
    this.videoDescription = '';
    this.mediaType       = null;
    this.uploadProgress  = 0;
    if (this.imageInput) this.imageInput.nativeElement.value = '';
    if (this.videoInput) this.videoInput.nativeElement.value = '';
  }

  // ==================== COMPARTIR ====================

  onShare() {
    if (!this.postContent.trim() && this.selectedImages.length === 0 && !this.selectedVideo) {
      alert('Por favor agrega contenido, imágenes o video');
      return;
    }

    this.isPosting      = true;
    this.uploadProgress = 0;

    if (this.selectedVideo) {
      const title       = this.videoTitle       || this.postContent.trim() || 'Mi video';
      const description = this.videoDescription || this.postContent.trim() || '';

      this.postsService.smartUpload(
        this.selectedVideo,
        this.postContent.trim(),
        title,
        description,
        this.userLanguage,   // ✅ Usa el idioma nativo del usuario
        undefined,
        [],
        true
      ).subscribe({
        next: (response) => {
          this.uploadProgress = 100;
          this.videoCreated.emit(response);

          if (response.content_type === 'post' && response.id) {
            this.postsService.getPostById(response.id).subscribe({
              next:  (post) => this.postCreated.emit(post),
              error: (err)  => console.error('❌ No se pudo obtener el post creado:', err)
            });
          }
          this.resetForm();
        },
        error: (error) => {
          let msg = 'Error subiendo el video.';
          if      (error.status === 401) msg = 'No estás autenticado. Por favor inicia sesión.';
          else if (error.status === 413) msg = 'El video es demasiado grande. Máximo 100MB.';
          else if (error.status === 400) msg = error.error?.detail || 'Datos inválidos.';
          else if (error.status === 500) msg = 'Error en el servidor. Intenta de nuevo.';
          else if (error.error?.detail)  msg = error.error.detail;
          alert(msg);
          this.isPosting      = false;
          this.uploadProgress = 0;
        },
        complete: () => { this.isPosting = false; }
      });

    } else {
      this.postsService.createPostWithMedia(
        this.postContent.trim(),
        this.selectedImages.length > 0 ? this.selectedImages : undefined,
        undefined,
        this.userLanguage   // ✅ Usa el idioma nativo del usuario (antes era 'en' hardcodeado)
      ).subscribe({
        next: (response) => {
          alert('¡Post publicado exitosamente!');
          this.resetForm();
          this.postCreated.emit(response);
        },
        error: (error) => {
          let msg = 'Error creando el post.';
          if      (error.status === 401)  msg = 'No estás autenticado. Por favor inicia sesión.';
          else if (error.error?.detail)   msg = error.error.detail;
          alert(msg);
          this.isPosting = false;
        },
        complete: () => { this.isPosting = false; }
      });
    }
  }

  // ==================== RESETEAR FORMULARIO ====================

  private resetForm() {
    this.postContent = '';
    this.videoTitle  = '';
    this.videoDescription = '';
    this.removeAllMedia();
    this.isPosting      = false;
    this.uploadProgress = 0;
  }

  // ==================== GETTERS ====================

  get canShare(): boolean {
    return !!(this.postContent.trim() || this.selectedImages.length > 0 || this.selectedVideo);
  }

  get isUploadingVideo(): boolean {
    return this.isPosting && this.selectedVideo !== null && this.uploadProgress < 100;
  }

  get uploadProgressText(): string {
    if (this.uploadProgress === 0)   return 'Preparando...';
    if (this.uploadProgress < 100)   return `Subiendo: ${this.uploadProgress}%`;
    return 'Procesando...';
  }
}
