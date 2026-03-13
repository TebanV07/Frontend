import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private apiUrl = 'https://web-production-94f95.up.railway.app/api/v1';

  currentUser: any = null;
  activeTab: 'profile' | 'account' | 'notifications' | 'privacy' = 'profile';

  // Estado UI
  isLoading = false;
  isSaving = false;
  saveSuccess = false;
  saveError = '';
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
  isUploadingAvatar = false;

  // ── Eliminar cuenta ──────────────────────────────────────
  showDeleteModal = false;
  deletePassword = '';
  deleteError = '';
  isDeletingAccount = false;

  // Formulario de perfil
  profileForm = {
    first_name: '',
    last_name: '',
    bio: '',
    website: '',
    location: '',
    native_language: 'es'
  };

  // Formulario de cuenta
  accountForm = {
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  };

  // Configuraciones de notificaciones
  notifSettings = {
    notifications_enabled: true,
    email_notifications: true
  };

  // Configuraciones de privacidad
  privacySettings = {
    private_account: false,
    auto_translate: true,
    preferred_translation_language: '',
    theme: 'auto'
  };

  languages = [
    { code: 'es', name: 'Espanol' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Frances' },
    { code: 'pt', name: 'Portugues' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh-cn', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) this.populateForms(user);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private populateForms(user: any) {
    this.profileForm = {
      first_name: user.first_name || user.firstName || '',
      last_name: user.last_name || user.lastName || '',
      bio: user.bio || '',
      website: user.website || '',
      location: user.location || '',
      native_language: user.native_language || user.nativeLanguage || 'es'
    };
    this.accountForm.email = user.email || '';
    this.notifSettings = {
      notifications_enabled: user.notifications_enabled ?? true,
      email_notifications: user.email_notifications ?? true
    };
    this.privacySettings = {
      private_account: user.private_account ?? false,
      auto_translate: user.auto_translate ?? true,
      preferred_translation_language: user.preferred_translation_language || user.preferredTranslationLanguage || '',
      theme: user.theme || 'auto'
    };
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getAvatarUrl(): string {
    if (this.avatarPreview) return this.avatarPreview;
    const avatar = this.currentUser?.avatar;
    if (!avatar) return 'assets/default-avatar.png';
    if (avatar.startsWith('http')) return avatar;
    return `https://web-production-94f95.up.railway.app${avatar}`;
  }

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.saveError = 'El archivo debe ser una imagen.'; return; }
    if (file.size > 5 * 1024 * 1024) { this.saveError = 'La imagen no debe superar 5MB.'; return; }
    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  uploadAvatar() {
    if (!this.avatarFile) return;
    this.isUploadingAvatar = true;
    this.saveError = '';
    const formData = new FormData();
    formData.append('file', this.avatarFile);
    this.http.post<any>(`${this.apiUrl}/users/me/avatar`, formData, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.isUploadingAvatar = false;
        this.avatarFile = null;
        this.authService.refreshCurrentUser?.();
        this.showSuccess();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 405) {
          this.uploadAvatarViaUpdate();
        } else {
          this.isUploadingAvatar = false;
          this.saveError = 'Error al subir la foto. Intenta de nuevo.';
        }
      }
    });
  }

  private uploadAvatarViaUpdate() {
    if (!this.avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', this.avatarFile);
    this.http.put<any>(`${this.apiUrl}/users/me`, formData, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.isUploadingAvatar = false;
        this.avatarFile = null;
        this.authService.refreshCurrentUser?.();
        this.showSuccess();
      },
      error: () => {
        this.isUploadingAvatar = false;
        this.saveError = 'Error al actualizar el avatar.';
      }
    });
  }

  saveProfile() {
    this.isSaving = true;
    this.saveError = '';
    if (this.avatarFile) this.uploadAvatar();
    this.http.put<any>(`${this.apiUrl}/users/me`, this.profileForm, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.isSaving = false;
        this.authService.refreshCurrentUser?.();
        this.showSuccess();
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err.error?.detail || 'Error al guardar los cambios.';
      }
    });
  }

  saveSettings() {
    this.isSaving = true;
    this.saveError = '';
    const payload = { ...this.notifSettings, ...this.privacySettings };
    this.http.put<any>(`${this.apiUrl}/users/me/settings`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => { this.isSaving = false; this.showSuccess(); },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err.error?.detail || 'Error al guardar la configuracion.';
      }
    });
  }

  changePassword() {
    if (!this.accountForm.current_password || !this.accountForm.new_password) {
      this.saveError = 'Completa todos los campos de contrasena.';
      return;
    }
    if (this.accountForm.new_password !== this.accountForm.confirm_password) {
      this.saveError = 'Las contrasenas nuevas no coinciden.';
      return;
    }
    if (this.accountForm.new_password.length < 8) {
      this.saveError = 'La nueva contrasena debe tener al menos 8 caracteres.';
      return;
    }
    this.isSaving = true;
    this.saveError = '';
    this.http.put<any>(`${this.apiUrl}/users/me/password`, {
      current_password: this.accountForm.current_password,
      new_password: this.accountForm.new_password
    }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.isSaving = false;
        this.accountForm.current_password = '';
        this.accountForm.new_password = '';
        this.accountForm.confirm_password = '';
        this.showSuccess();
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err.error?.detail || 'Error al cambiar la contrasena.';
      }
    });
  }

  // ── Eliminar cuenta ──────────────────────────────────────

  openDeleteModal() {
    this.deletePassword = '';
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  cancelDelete() {
    if (this.isDeletingAccount) return;
    this.showDeleteModal = false;
    this.deletePassword = '';
    this.deleteError = '';
  }

  confirmDelete() {
    if (!this.deletePassword || this.isDeletingAccount) return;
    this.isDeletingAccount = true;
    this.deleteError = '';

    const formData = new FormData();
    formData.append('password', this.deletePassword);

    this.http.delete<any>(`${this.apiUrl}/users/me`, {
      headers: this.getHeaders(),
      body: formData
    }).subscribe({
      next: () => {
        // Limpiar todo y redirigir al login
        localStorage.clear();
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isDeletingAccount = false;
        if (err.status === 400) {
          this.deleteError = 'Contrasena incorrecta. Intenta de nuevo.';
        } else {
          this.deleteError = 'Error al eliminar la cuenta. Intenta mas tarde.';
        }
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────

  private showSuccess() {
    this.saveSuccess = true;
    setTimeout(() => { this.saveSuccess = false; }, 3000);
  }

  onAvatarError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/default-avatar.png';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}


