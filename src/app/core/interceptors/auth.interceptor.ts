// src/app/core/interceptors/auth.interceptor.ts
// Reemplaza el archivo completo

import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError, Observable } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─── Estado singleton del refresh (vive a nivel de módulo, no de instancia) ───
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

// ─── URLs que NUNCA deben entrar en el flujo de refresh ───────────────────────
const SKIP_REFRESH_URLS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/google/login',
  '/auth/facebook/login',
  '/auth/apple/login',
  '/assets/',
];

function shouldSkipRefresh(url: string): boolean {
  return SKIP_REFRESH_URLS.some((path) => url.includes(path));
}

// ─── Helpers localStorage ─────────────────────────────────────────────────────
function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

function saveNewTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

function clearSession(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('currentUser');
}

// ─── Clona la request con un nuevo Bearer token ───────────────────────────────
function cloneWithToken(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

// ─── Llama al endpoint de refresh y devuelve el nuevo access_token ────────────
function doRefresh(http: HttpClient): Observable<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return throwError(() => new Error('No hay refresh token'));
  }

  return http
    .post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
    }>(`${environment.apiUrl}/auth/refresh`, {
      refresh_token: refreshToken,
    })
    .pipe(
      switchMap((response) => {
        saveNewTokens(response.access_token, response.refresh_token);
        return [response.access_token];
      })
    );
}

// ─── Interceptor principal ────────────────────────────────────────────────────
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const platformId = inject(PLATFORM_ID);
  const http = inject(HttpClient);
  const router = inject(Router);

  // SSR: no tocar nada
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Assets estáticos: pasar sin token
  if (req.url.startsWith('/assets/')) {
    return next(req);
  }

  // Adjuntar token actual si existe (comportamiento original conservado)
  const token = getAccessToken();
  const authReq = token ? cloneWithToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo interceptamos 401 y solo si no es una URL de auth
      if (error.status !== 401 || shouldSkipRefresh(req.url)) {
        return throwError(() => error);
      }

      // ── Caso: ya hay un refresh en curso ─────────────────────────────────
      // Encolar esta petición hasta que el refresh termine
      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter((newToken) => newToken !== null),
          take(1),
          switchMap((newToken) => next(cloneWithToken(req, newToken!)))
        );
      }

      // ── Iniciar refresh ───────────────────────────────────────────────────
      isRefreshing = true;
      refreshTokenSubject.next(null); // Bloquear peticiones en cola

      return doRefresh(http).pipe(
        switchMap((newToken: string) => {
          refreshTokenSubject.next(newToken); // Desbloquear cola
          return next(cloneWithToken(req, newToken));
        }),
        catchError((refreshError) => {
          // Refresh falló → limpiar sesión y redirigir a login
          clearSession();
          router.navigate(['/login'], {
            queryParams: { reason: 'session_expired' },
          });
          return throwError(() => refreshError);
        }),
        finalize(() => {
          isRefreshing = false;
        })
      );
    })
  );
};
