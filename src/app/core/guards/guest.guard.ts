import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true; // Puede entrar al login
  }

  // Ya está logueado → fuera del login
  router.navigate([authService.isCurrentUserVerified() ? '/home' : '/verify-email-required']);
  return false;
};
