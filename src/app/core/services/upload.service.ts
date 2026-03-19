import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  upload(formData: FormData): Observable<UploadResponse> {
    return this.http.post<UploadResponse>(
      `${this.apiUrl}/upload/`,
      formData
    );
  }
}

