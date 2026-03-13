import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionsGuard implements CanActivate {

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

    // Si no ha configurado permisos, redirigir a permisos
    if (!this.permissionsService.hasConfiguredPermissions()) {
      this.router.navigate(['/permissions']);
      return false;
    }

    return true;
  }
}

