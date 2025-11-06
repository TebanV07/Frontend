import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    native_language: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
  };
  token: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
  message: string;
}

export interface RegisterResponse {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    native_language: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8001/api/v1';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Check if we're in a browser environment
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Only access localStorage if we're in the browser
    if (this.isBrowser) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
  const payload = { email, password };
  console.log('🔵 Enviando a login:', payload);
  console.log('🔵 URL completa:', `${this.apiUrl}/auth/login`);

  return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, payload)
    .pipe(
      tap(response => {
        console.log('✅ Respuesta exitosa:', response);
        if (this.isBrowser) {
          localStorage.setItem('access_token', response.token.access_token);
          localStorage.setItem('refresh_token', response.token.refresh_token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(userData: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    native_language: string;
  }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    // Only clear localStorage if we're in the browser
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    
    // Redirect to login
    this.router.navigate(['/login']);
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser() && 
           (this.isBrowser ? !!localStorage.getItem('access_token') : false);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('access_token') : null;
  }
}