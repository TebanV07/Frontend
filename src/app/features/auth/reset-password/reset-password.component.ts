import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  status: 'form' | 'success' | 'error' = 'form';
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.params['token'] || '';
    if (!this.token) {
      this.status = 'error';
      this.errorMessage = this.translate.instant('auth.resetPass.invalidToken');
    }
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = this.translate.instant('auth.resetPass.fillBothFields');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = this.translate.instant('auth.resetPass.passwordsMismatch');
      return;
    }

    this.isLoading = true;
    this.authService.confirmPasswordReset(this.token, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.status = 'success';
        this.successMessage = res.message || 'Tu contraseña fue actualizada correctamente.';
      },
      error: (err) => {
        this.isLoading = false;
        this.status = 'error';
        this.errorMessage = err.error?.detail || 'El enlace es inválido o expiró. Solicita uno nuevo.';
      }
    });
  }
}

