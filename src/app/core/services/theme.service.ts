import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _darkMode = signal(true);
  isDarkMode = this._darkMode.asReadonly();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('darkMode');
      const isDark = saved !== null ? saved === 'true' : true;
      this._darkMode.set(isDark);
      this.applyTheme(isDark);
    }
  }

  toggleTheme() {
    const newValue = !this._darkMode();
    this._darkMode.set(newValue);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkMode', newValue.toString());
      this.applyTheme(newValue);
    }
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }
}