import { Injectable, Inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    native_language: string;
    country_code: string | null;   // ⭐ NUEVO
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
    country_code: string | null;   // ⭐ NUEVO
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
  };
  message: string;
}

// ⭐ NUEVO: Respuesta del endpoint de detección de país
export interface CountryDetectResponse {
  country_code: string | null;
  country_name: string | null;
  saved: boolean;
  message?: string;
}

// ⭐ NUEVO: Respuesta genérica de login social (Google, Facebook, Apple)
export interface SocialLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: LoginResponse['user'];
  message: string;
}

export interface PasswordResetRequestResponse {
  message: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

export interface VerificationEmailResponse {
  message: string;
  dev_token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  refreshCurrentUser(): void {
    this.syncCurrentUser().subscribe({
      error: () => { /* silencioso */ }
    });
  }

  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    private injector: Injector,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
        if (user?.id) {
          this.getFollowService().loadInitialData(user.id);
        }
      }
    }
  }

  private getFollowService() {
    const { FollowService } = require('./follow.service');
    return this.injector.get(FollowService);
  }

  private getLanguageService() {
    const { LanguageService } = require('./language.service');
    return this.injector.get(LanguageService);
  }

  // ============================================
  // LOGIN / REGISTER CON EMAIL
  // ============================================

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this._saveSession(response.token.access_token, response.token.refresh_token, response.user);
          this._postLoginActions(response.user);
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

  requestPasswordReset(email: string): Observable<PasswordResetRequestResponse> {
    return this.http.post<PasswordResetRequestResponse>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  confirmPasswordReset(token: string, newPassword: string): Observable<PasswordResetConfirmResponse> {
    return this.http.post<PasswordResetConfirmResponse>(`${this.apiUrl}/auth/reset-password/confirm`, {
      token,
      new_password: newPassword
    });
  }

  resendVerificationEmail(): Observable<VerificationEmailResponse> {
    return this.http.post<VerificationEmailResponse>(
      `${this.apiUrl}/users/me/verify-email/send`,
      {},
      this._getAuthRequestOptions()
    );
  }

  syncCurrentUser(): Observable<any> {
    if (!this.isBrowser || !this.getToken()) {
      return EMPTY;
    }

    return this.http.get<any>(`${this.apiUrl}/users/me`, this._getAuthRequestOptions())
      .pipe(
        tap(user => this._updateCurrentUser(user))
      );
  }

  // ============================================
  // GOOGLE OAUTH
  // ============================================

  /**
   * Envía el token de Google al backend y obtiene tokens JWT.
   * Llama a este método desde el botón de Google en login.component.ts
   * después de obtener el idToken del SDK de Google.
   *
   * Ejemplo de uso en el componente:
   *   google.accounts.id.initialize({
   *     client_id: 'TU_GOOGLE_CLIENT_ID',
   *     callback: (response) => this.authService.loginWithGoogle(response.credential).subscribe(...)
   *   });
   */
  loginWithGoogle(googleToken: string): Observable<SocialLoginResponse> {
    return this.http.post<SocialLoginResponse>(`${this.apiUrl}/auth/google/login`, { token: googleToken })
      .pipe(
        tap(response => {
          this._saveSession(response.access_token, response.refresh_token, response.user);
          this._postLoginActions(response.user);
        })
      );
  }

  // ============================================
  // FACEBOOK OAUTH
  // ============================================

  /**
   * Envía el accessToken de Facebook al backend.
   * Llama a este método después de obtener el token con el SDK de Facebook:
   *   FB.login((response) => {
   *     if (response.authResponse) {
   *       this.authService.loginWithFacebook(response.authResponse.accessToken).subscribe(...)
   *     }
   *   }, { scope: 'email' });
   */
  loginWithFacebook(accessToken: string): Observable<SocialLoginResponse> {
    return this.http.post<SocialLoginResponse>(`${this.apiUrl}/auth/facebook/login`, { access_token: accessToken })
      .pipe(
        tap(response => {
          this._saveSession(response.access_token, response.refresh_token, response.user);
          this._postLoginActions(response.user);
        })
      );
  }

  // ============================================
  // APPLE OAUTH
  // ============================================

  /**
   * Envía el identityToken de Apple al backend.
   * En iOS usa ASAuthorizationAppleIDCredential.identityToken
   * En web usa la respuesta de AppleID.auth.signIn()
   *
   * IMPORTANTE: Apple solo envía nombre y apellido en el PRIMER login.
   * El frontend debe guardarlo localmente y enviarlo siempre.
   */
  loginWithApple(identityToken: string, firstName?: string, lastName?: string): Observable<SocialLoginResponse> {
    return this.http.post<SocialLoginResponse>(`${this.apiUrl}/auth/apple/login`, {
      identity_token: identityToken,
      first_name: firstName || null,
      last_name: lastName || null
    }).pipe(
      tap(response => {
        this._saveSession(response.access_token, response.refresh_token, response.user);
        this._postLoginActions(response.user);
      })
    );
  }

  // ============================================
  // DETECCIÓN DE PAÍS ⭐ NUEVO
  // ============================================

  /**
   * Detecta el país del usuario por IP y lo guarda en el backend.
   * Se llama automáticamente después de cualquier login.
   * Si el usuario ya tiene país guardado, el backend no lo sobreescribe.
   */
  detectCountry(): Observable<CountryDetectResponse> {
    return this.http.post<CountryDetectResponse>(`${this.apiUrl}/auth/detect-country`, {});
  }

  /**
   * Actualizar el país manualmente (desde el modal de confirmación).
   */
  updateCountry(countryCode: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/update-country`, { country_code: countryCode })
      .pipe(
        tap(() => {
          // Actualizar también en localStorage
          if (this.isBrowser) {
            const user = this.getCurrentUser();
            if (user) {
              user.country_code = countryCode;
              localStorage.setItem('currentUser', JSON.stringify(user));
              this.currentUserSubject.next({ ...user });
            }
          }
        })
      );
  }

  /**
   * ¿El usuario actual necesita configurar su país?
   * True si no tiene country_code guardado.
   */
  needsCountrySetup(): boolean {
    const user = this.getCurrentUser();
    return !!user && !user.country_code;
  }

  // ============================================
  // LOGOUT / HELPERS
  // ============================================

  logout(): void {
    this.getFollowService().clearData();
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  isCurrentUserVerified(): boolean {
    const user = this.getCurrentUser();
    return Boolean(user?.is_verified ?? user?.isVerified ?? false);
  }

  needsEmailVerification(): boolean {
    return this.isLoggedIn() && !this.isCurrentUserVerified();
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser() &&
      (this.isBrowser ? !!localStorage.getItem('access_token') : false);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('access_token') : null;
  }

  getCurrentUserId(): number | null {
    return this.getCurrentUser()?.id ?? null;
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /** Guardar tokens y usuario en localStorage y BehaviorSubject */
  private _saveSession(accessToken: string, refreshToken: string, user: any): void {
    if (this.isBrowser) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
    this._updateCurrentUser(user);
  }

  private _updateCurrentUser(user: any): void {
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  private _getAuthRequestOptions(): { headers?: { Authorization: string } } {
    const token = this.getToken();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  /** Acciones post-login: cargar datos de follows y detectar país */
  private _postLoginActions(user: any): void {
    // Aplicar idioma nativo del usuario
    if (user?.native_language) {
      this.getLanguageService().setLanguage(user.native_language);
    }

    if (user?.id) {
      this.getFollowService().loadInitialData(user.id);
    }
    // Detectar país en segundo plano — no bloquea el flujo de login
    this.detectCountry().subscribe({
      next: (res) => {
        if (res.country_code) {
          // Actualizar el usuario en memoria con el país detectado
          const currentUser = this.getCurrentUser();
          if (currentUser) {
            const updated = { ...currentUser, country_code: res.country_code };
            if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(updated));
            this.currentUserSubject.next(updated);
          }
        }
      },
      error: () => { /* silencioso — no interrumpir el login */ }
    });
  }

  /**
   * ⭐ NUEVO: Método que espera a que la detección de país termine.
   * Usa este método después de login para decidir si mostrar el modal de país.
   * Retorna una Promise que se resuelve cuando ya se conoce el país.
   */
  async waitForCountryDetection(): Promise<void> {
    // Esperar un máximo de 3 segundos para que detectCountry() termine
    const startTime = Date.now();
    while (Date.now() - startTime < 3000) {
      const user = this.getCurrentUser();
      if (user?.country_code) {
        return; // Ya se detectó el país
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

