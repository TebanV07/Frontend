import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './verify-email.component.html',  // si usas archivo externo
  styleUrls: ['./verify-email.component.scss']   // styleUrls (no stylesUrls)
})
export class VerifyEmailComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  errorMsg = '';
  retryRoute = '/login';

  private apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.retryRoute = this.authService.isLoggedIn() ? '/verify-email-required' : '/login';

    const token = this.route.snapshot.params['token'];
    if (!token) {
      this.status = 'error';
      this.errorMsg = 'No se encontro el token de verificacion.';
      return;
    }

    this.http.get<any>(`${this.apiUrl}/users/verify-email/${token}`).subscribe({
      next: () => {
        if (this.authService.isLoggedIn()) {
          this.authService.syncCurrentUser().subscribe({
            next: () => {
              this.status = 'success';
            },
            error: () => {
              this.status = 'success';
            }
          });
          return;
        }

        this.status = 'success';
      },
      error: (err) => {
        this.status = 'error';
        this.errorMsg = err.error?.detail || 'Token invalido o expirado. Solicita uno nuevo desde Ajustes.';
      }
    });
  }
}

