import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _darkMode = signal(true);
  isDarkMode = this._darkMode.asReadonly();

  // Colores sólidos resultantes de mezclar --header-bg sobre --bg-color
  // (la StatusBar nativa no soporta transparencia/blur)
  private readonly STATUS_BAR_COLOR_DARK = '#0b0d13';
  private readonly STATUS_BAR_COLOR_LIGHT = '#fefefe';

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
    this.applyStatusBarTheme(isDark);
  }

  private applyStatusBarTheme(isDark: boolean): void {
    // Solo corre dentro de la app nativa (Android/iOS), no en navegador
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const color = isDark ? this.STATUS_BAR_COLOR_DARK : this.STATUS_BAR_COLOR_LIGHT;

    // setBackgroundColor solo existe en Android; en iOS es un no-op silencioso
    // que el propio plugin maneja, así que es seguro llamarlo siempre.
    StatusBar.setBackgroundColor({ color }).catch(err =>
      console.warn('No se pudo cambiar el color de la StatusBar:', err)
    );

    // Style.Dark = iconos/texto CLAROS (para fondos oscuros)
    // Style.Light = iconos/texto OSCUROS (para fondos claros)
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(err =>
      console.warn('No se pudo cambiar el estilo de la StatusBar:', err)
    );
  }
}
