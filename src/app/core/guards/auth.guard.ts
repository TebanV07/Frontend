import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, switchMap, take } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // SSR: dejar pasar siempre
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // PASO 1: Esperar a que _restoreSession() termine completamente
  // antes de evaluar si el usuario está autenticado.
  //
  // Sin esto, el guard lee currentUser$ cuando aún es null
  // (porque _restoreSession() no ha terminado de llamar a /users/me)
  // y redirige al login innecesariamente.
  return authService.authReady$.pipe(
    filter(ready => ready === true), // Espera a que la sesión esté restaurada
    take(1),
    switchMap(() => authService.currentUser$),
    take(1),
    map(user => {
      if (!user || !authService.isLoggedIn()) {
        router.navigate(['/login']);
        return false;
      }

      if (!authService.isCurrentUserVerified()) {
        router.navigate(['/verify-email-required']);
        return false;
      }

      return true;
    })
  );
};
