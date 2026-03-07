import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.component.html',  // si usas archivo externo
  styleUrls: ['./verify-email.component.scss']   // styleUrls (no stylesUrls)
})
export class VerifyEmailComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  errorMsg = '';

  private apiUrl = 'http://localhost:8001/api/v1';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.params['token'];
    if (!token) {
      this.status = 'error';
      this.errorMsg = 'No se encontró el token de verificación.';
      return;
    }

    this.http.get<any>(`${this.apiUrl}/users/verify-email/${token}`).subscribe({
      next: () => {
        this.status = 'success';
      },
      error: (err) => {
        this.status = 'error';
        this.errorMsg = err.error?.detail || 'Token inválido o expirado. Solicita uno nuevo desde Ajustes.';
      }
    });
  }
}
