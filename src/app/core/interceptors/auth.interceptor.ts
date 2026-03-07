import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('='.repeat(60));
  console.log('🔵 INTERCEPTOR - Petición interceptada');
  console.log('🔵 URL:', req.url);
  console.log('🔵 Method:', req.method);

  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
      console.log('�pacheco️ SSR detectado - pero continuando de todas formas');
      // No saltar, seguir abajo para intentar agregar el token
  }

  const token = localStorage.getItem('access_token');
  console.log('🔵 Token en localStorage:', token ? `SÍ (${token.substring(0, 30)}...)` : 'NO');

  if (token) {
    console.log('🔵 Clonando request y agregando Authorization...');

    const modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Request clonado');
    console.log('🔍 Headers del request modificado:', modifiedReq.headers.keys());
    console.log('🔍 Authorization header:', modifiedReq.headers.get('Authorization'));
    console.log('='.repeat(60));

    return next(modifiedReq);
  }

  console.log('⚠️ No hay token - enviando sin Authorization');
  console.log('='.repeat(60));
  return next(req);
};
