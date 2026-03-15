import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  content_type: 'video' | 'post';
  redirect_to: string;
  id?: number;
  uuid?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeadersWithoutContentType(): HttpHeaders {
    // Similar helper to other services but skip content-type header
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        return new HttpHeaders({
          Authorization: `Bearer ${token}`
        });
      }
    }
    return new HttpHeaders();
  }

  upload(formData: FormData): Observable<UploadResponse> {
    return this.http.post<UploadResponse>(
      `${this.apiUrl}/upload/`,
      formData,
      {
        headers: this.getHeadersWithoutContentType()
      }
    );
  }
}

