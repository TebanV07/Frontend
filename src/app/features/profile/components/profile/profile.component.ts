import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProfileService, UserProfile } from '../../../../core/services/profile.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { ProfileTabsComponent } from '../profile-tabs/profile-tabs.component';
import { ProfileContentComponent } from '../profile-content/profile-content.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileHeaderComponent,
    ProfileTabsComponent,
    ProfileContentComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  currentUserProfile: UserProfile | null = null;
  selectedTab: 'posts' | 'videos' | 'liked' | 'bookmarks' = 'posts';
  isOwnProfile = true;
  isFollowing = false;
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔵 ProfileComponent ngOnInit');

    // Obtener el perfil del usuario actual primero
    this.profileService.getCurrentProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (currentProfile) => {
          this.currentUserProfile = currentProfile;
          console.log('👤 Usuario actual:', currentProfile?.username);

          // Cargar el perfil según la ruta
          this.loadProfile();
        },
        error: (err) => {
          console.error('❌ Error obteniendo usuario actual:', err);
          // Si no hay usuario actual, redirigir al login
          if (err.status === 401) {
            this.router.navigate(['/login']);
          } else {
            this.loadProfile();
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfile() {
    // Escuchar cambios en los parámetros de la ruta
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const username = params['username'];

        console.log('🔍 Parámetro username:', username);
        console.log('👤 Usuario actual:', this.currentUserProfile?.username);

        if (username) {
          // Visitando el perfil de un usuario específico
          this.isOwnProfile = username === this.currentUserProfile?.username;
          console.log('🏠 ¿Es mi perfil?', this.isOwnProfile);

          if (this.isOwnProfile) {
            // Si es el propio usuario, cargar desde getCurrentProfile
            this.loadOwnProfile();
          } else {
            // Si es otro usuario, cargar por username
            this.loadProfileByUsername(username);
          }
        } else {
          // No hay username en la URL, mostrar perfil propio
          this.isOwnProfile = true;
          this.loadOwnProfile();
        }
      });
  }

  private loadProfileByUsername(username: string) {
    this.isLoading = true;

    console.log(`📥 Cargando perfil de @${username}...`);

    this.profileService.getProfileByUsername(username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          console.log('✅ Perfil cargado:', profile);

          if (!profile) {
            console.error('❌ Perfil no encontrado');
            // Mostrar mensaje de error o redirigir
            this.router.navigate(['/profile']);
            return;
          }

          this.profile = profile;
          this.isFollowing = profile.isFollowing || false;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error cargando perfil:', err);
          this.isLoading = false;

          // Si el usuario no existe, redirigir al perfil propio
          if (err.status === 404) {
            console.log('Usuario no encontrado, redirigiendo...');
            this.router.navigate(['/profile']);
          }
        }
      });
  }

  private loadOwnProfile() {
    this.isLoading = true;

    console.log('📥 Cargando mi perfil...');

    this.profileService.getCurrentProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          console.log('✅ Mi perfil cargado:', profile);
          this.profile = profile;
          this.isFollowing = false; // No puedes seguirte a ti mismo
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error cargando mi perfil:', err);
          this.isLoading = false;
        }
      });
  }

  toggleFollow() {
    if (!this.profile || this.isOwnProfile) {
      console.log('⚠️ No se puede seguir (perfil propio o no existe)');
      return;
    }

    console.log(`🔄 Toggling follow para usuario ${this.profile.id}...`);

    this.profileService.toggleFollow(this.profile.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isFollowing) => {
          this.isFollowing = isFollowing;

          // Actualizar el contador de seguidores localmente
          if (this.profile) {
            this.profile.followers = isFollowing
              ? this.profile.followers + 1
              : this.profile.followers - 1;
          }

          this.cdr.detectChanges();
          console.log('✅ Estado de follow actualizado:', isFollowing);
        },
        error: (err) => {
          console.error('❌ Error al toggle follow:', err);
        }
      });
  }

  selectTab(tab: 'posts' | 'videos' | 'liked' | 'bookmarks') {
    this.selectedTab = tab;
  }

  editProfile() {
    console.log('Edit profile');
    // Implementar navegación a edición de perfil
    this.router.navigate(['/settings']);
  }

  shareProfile() {
    console.log('Share profile');
    // Implementar compartir perfil
    if (this.profile) {
      const url = `${window.location.origin}/profile/${this.profile.username}`;
      navigator.clipboard.writeText(url).then(() => {
        console.log('✅ URL copiada al portapapeles');
      });
    }
  }

  openSettings() {
    console.log('Open settings');
    this.router.navigate(['/settings']);
  }
}
