import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { CountrySetupComponent } from '../../../shared/components';

@Component({
  selector: 'app-verify-email-required',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, CountrySetupComponent],
  templateUrl: './verify-email-required.component.html',
  styleUrls: ['./verify-email-required.component.scss']
})
export class VerifyEmailRequiredComponent implements OnInit {
  user: any = null;
  infoMessage = '';
  errorMessage = '';
  isSending = false;
  isRefreshing = false;
  showCountrySetup = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = this.authService.getCurrentUser();
    this.handleVerifiedState();
  }

  resendVerificationEmail(): void {
    this.isSending = true;
    this.infoMessage = '';
    this.errorMessage = '';

    this.authService.resendVerificationEmail().subscribe({
      next: (response) => {
        this.isSending = false;
        this.infoMessage = response.message || 'Te reenviamos el correo de verificación.';
      },
      error: (error) => {
        this.isSending = false;
        this.errorMessage = error.error?.detail || 'No se pudo reenviar el correo de verificación.';
      }
    });
  }

  refreshVerificationStatus(): void {
    this.isRefreshing = true;
    this.infoMessage = '';
    this.errorMessage = '';

    this.authService.syncCurrentUser().subscribe({
      next: (user) => {
        this.isRefreshing = false;
        this.user = user;

        if (this.authService.isCurrentUserVerified()) {
          this.infoMessage = 'Tu cuenta ya está verificada.';
          this.handleVerifiedState();
          return;
        }

        this.infoMessage = 'Tu cuenta todavía no ha sido verificada. Revisa tu correo e inténtalo de nuevo.';
      },
      error: (error) => {
        this.isRefreshing = false;
        this.errorMessage = error.error?.detail || 'No se pudo actualizar el estado de verificación.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  onCountrySetupCompleted(): void {
    this.showCountrySetup = false;
    this.router.navigate(['/home']);
  }

  private handleVerifiedState(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isCurrentUserVerified()) {
      return;
    }

    if (this.authService.needsCountrySetup()) {
      this.showCountrySetup = true;
      return;
    }

    this.router.navigate(['/home']);
  }
}

