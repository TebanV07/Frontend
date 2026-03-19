import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return authService.currentUser$.pipe(
    filter(user => user !== undefined),
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

