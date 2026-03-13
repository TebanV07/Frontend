import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = this.translate.instant('auth.forgotPass.emailRequired');
      return;
    }

    this.isLoading = true;
    this.authService.requestPasswordReset(this.email.trim()).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Si el email existe, te enviaremos un enlace de recuperación.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'No se pudo procesar tu solicitud. Intenta de nuevo.';
      }
    });
  }
}

