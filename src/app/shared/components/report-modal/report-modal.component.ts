// src/app/shared/components/report-modal/report-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface ReportPayload {
  content_type: 'post' | 'video' | 'comment';
  content_id: number;
  reason: string;
  description?: string;
}

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './report-modal.component.html',
  styleUrls: ['./report-modal.component.scss']
})
export class ReportModalComponent {
  @Input() contentType: 'post' | 'video' | 'comment' = 'post';
  @Input() contentId!: number;
  @Output() closed = new EventEmitter<void>();

  private apiUrl = 'https://web-production-94f95.up.railway.app/api/v1';

  selectedReason = '';
  description = '';
  isSubmitting = false;
  errorMsg = '';
  successMsg = '';

  reasons = [
    { value: 'spam',           icon: '??', label: 'Spam o contenido repetitivo' },
    { value: 'harassment',     icon: '??', label: 'Acoso o intimidacion' },
    { value: 'inappropriate',  icon: '??', label: 'Contenido inapropiado o sexual' },
    { value: 'misinformation', icon: '?', label: 'Informacion falsa o enganosa' },
    { value: 'violence',       icon: '??', label: 'Violencia o contenido peligroso' },
    { value: 'hate_speech',    icon: '??', label: 'Discurso de odio' },
    { value: 'other',          icon: '??', label: 'Otro motivo' }
  ];

  constructor(private http: HttpClient) {}

  onOverlayClick(event: MouseEvent): void {
    // El inner .report-modal tiene (click)="$event.stopPropagation()"
    // asi que este handler solo se dispara cuando se hace clic en el fondo
    this.cancel();
  }

  cancel(): void {
    this.closed.emit();
  }

  submit(): void {
    if (!this.selectedReason || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMsg = '';
    this.successMsg = '';

    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const payload: ReportPayload = {
      content_type: this.contentType,
      content_id: this.contentId,
      reason: this.selectedReason,
      description: this.description.trim() || undefined
    };

    this.http.post(`${this.apiUrl}/reports/`, payload, { headers }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMsg = 'Denuncia enviada. Gracias por ayudarnos a mantener la comunidad segura.';
        setTimeout(() => this.closed.emit(), 2200);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMsg = err.error?.detail || 'Error al enviar la denuncia. Intenta de nuevo.';
      }
    });
  }
}


