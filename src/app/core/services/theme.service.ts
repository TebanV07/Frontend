import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = signal(true); // Por defecto modo oscuro

  isDarkMode = this.darkMode.asReadonly();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('darkMode');
      if (saved) {
        this.darkMode.set(saved === 'true');
      }
    }
  }

  toggleTheme() {
    this.darkMode.set(!this.darkMode());
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkMode', this.darkMode().toString());
    }
  }
}
