import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';

@Injectable({
  providedIn: 'root'
})
export class TermsGuard implements CanActivate {

  constructor(
    private permissionsService: PermissionsService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Permitir acceso a login, terms y permissions sin restricción
    const allowedPaths = ['/login', '/terms', '/permissions'];
    if (allowedPaths.includes(state.url)) {
      return true;
    }

    // Si no ha aceptado términos, redirigir a términos
    if (!this.permissionsService.hasAcceptedTerms()) {
      this.router.navigate(['/terms']);
      return false;
    }

    return true;
  }
}

