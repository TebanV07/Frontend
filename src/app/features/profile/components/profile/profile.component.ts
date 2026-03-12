import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
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
    ProfileContentComponent, TranslateModule],
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
    console.log('ðŸ”µ ProfileComponent ngOnInit');

    // Obtener el perfil del usuario actual primero
    this.profileService.getCurrentProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (currentProfile) => {
          this.currentUserProfile = currentProfile;
          console.log('ðŸ‘¤ Usuario actual:', currentProfile?.username);

          // Cargar el perfil segÃºn la ruta
          this.loadProfile();
        },
        error: (err) => {
          console.error('âŒ Error obteniendo usuario actual:', err);
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
    // Escuchar cambios en los parÃ¡metros de la ruta
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const username = params['username'];

        console.log('ðŸ” ParÃ¡metro username:', username);
        console.log('ðŸ‘¤ Usuario actual:', this.currentUserProfile?.username);

        if (username) {
          // Visitando el perfil de un usuario especÃ­fico
          this.isOwnProfile = username === this.currentUserProfile?.username;
          console.log('ðŸ  Â¿Es mi perfil?', this.isOwnProfile);

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

    console.log(`ðŸ“¥ Cargando perfil de @${username}...`);

    this.profileService.getProfileByUsername(username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          console.log('âœ… Perfil cargado:', profile);

          if (!profile) {
            console.error('âŒ Perfil no encontrado');
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
          console.error('âŒ Error cargando perfil:', err);
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

    console.log('ðŸ“¥ Cargando mi perfil...');

    this.profileService.getCurrentProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          console.log('âœ… Mi perfil cargado:', profile);
          this.profile = profile;
          this.isFollowing = false; // No puedes seguirte a ti mismo
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('âŒ Error cargando mi perfil:', err);
          this.isLoading = false;
        }
      });
  }

  toggleFollow() {
    if (!this.profile || this.isOwnProfile) {
      console.log('âš ï¸ No se puede seguir (perfil propio o no existe)');
      return;
    }

    console.log(`ðŸ”„ Toggling follow para usuario ${this.profile.id}...`);

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
          console.log('âœ… Estado de follow actualizado:', isFollowing);
        },
        error: (err) => {
          console.error('âŒ Error al toggle follow:', err);
        }
      });
  }

  selectTab(tab: 'posts' | 'videos' | 'liked' | 'bookmarks') {
    this.selectedTab = tab;
  }

  editProfile() {
    console.log('Edit profile');
    // Implementar navegaciÃ³n a ediciÃ³n de perfil
    this.router.navigate(['/settings']);
  }

  shareProfile() {
    console.log('Share profile');
    // Implementar compartir perfil
    if (this.profile) {
      const url = `${window.location.origin}/profile/${this.profile.username}`;
      navigator.clipboard.writeText(url).then(() => {
        console.log('âœ… URL copiada al portapapeles');
      });
    }
  }

  openSettings() {
    console.log('Open settings');
    this.router.navigate(['/settings']);
  }
}

