import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  readonly SUPPORTED_LANGUAGES: Language[] = [
    { code: 'es', name: 'Spanish',    nativeName: 'Español',    flag: '🇪🇸', dir: 'ltr' },
    { code: 'en', name: 'English',    nativeName: 'English',    flag: '🇺🇸', dir: 'ltr' },
    { code: 'fr', name: 'French',     nativeName: 'Français',   flag: '🇫🇷', dir: 'ltr' },
    { code: 'de', name: 'German',     nativeName: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português',  flag: '🇧🇷', dir: 'ltr' },
    { code: 'it', name: 'Italian',    nativeName: 'Italiano',   flag: '🇮🇹', dir: 'ltr' },
    { code: 'ja', name: 'Japanese',   nativeName: '日本語',      flag: '🇯🇵', dir: 'ltr' },
    { code: 'zh', name: 'Chinese',    nativeName: '中文',        flag: '🇨🇳', dir: 'ltr' },
    { code: 'ko', name: 'Korean',     nativeName: '한국어',      flag: '🇰🇷', dir: 'ltr' },
    { code: 'ru', name: 'Russian',    nativeName: 'Русский',    flag: '🇷🇺', dir: 'ltr' },
    { code: 'ar', name: 'Arabic',     nativeName: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
    { code: 'hi', name: 'Hindi',      nativeName: 'हिन्दी',     flag: '🇮🇳', dir: 'ltr' },
    { code: 'nl', name: 'Dutch',      nativeName: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
    { code: 'pl', name: 'Polish',     nativeName: 'Polski',     flag: '🇵🇱', dir: 'ltr' },
    { code: 'tr', name: 'Turkish',    nativeName: 'Türkçe',     flag: '🇹🇷', dir: 'ltr' },
  ];

  private readonly STORAGE_KEY = 'tinko_language';
  private readonly DEFAULT_LANG = 'es';

  private currentLang$ = new BehaviorSubject<string>(this.DEFAULT_LANG);
  currentLanguage$ = this.currentLang$.asObservable();

  constructor(private translate: TranslateService) {}

  /**
   * Call once from AppComponent.ngOnInit()
   */
  init(): void {
    const codes = this.SUPPORTED_LANGUAGES.map(l => l.code);
    this.translate.addLangs(codes);
    this.translate.setDefaultLang(this.DEFAULT_LANG);

    const saved = this.getSavedLanguage();
    const browser = this.detectBrowserLanguage();
    const initial = saved ?? browser ?? this.DEFAULT_LANG;

    this.setLanguage(initial, false); // don't save again on first load
  }

  /**
   * Change the active UI language.
   * @param code  ISO 639-1 language code (e.g. 'en', 'ar')
   * @param save  persist to localStorage (default true)
   */
  setLanguage(code: string, save = true): void {
    const lang = this.SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (!lang) {
      console.warn(`[LanguageService] Unsupported language: ${code}`);
      return;
    }

    this.translate.use(code).subscribe({
      next: () => {
        this.currentLang$.next(code);
        this.applyDirection(lang.dir);
        if (save) this.saveLanguage(code);
      },
      error: err => console.error(`[LanguageService] Failed to load ${code}:`, err)
    });
  }

  getCurrentLanguage(): string {
    return this.currentLang$.getValue();
  }

  getCurrentLanguageInfo(): Language {
    return this.SUPPORTED_LANGUAGES.find(l => l.code === this.getCurrentLanguage())
      ?? this.SUPPORTED_LANGUAGES[0];
  }

  isRTL(): boolean {
    return this.getCurrentLanguageInfo().dir === 'rtl';
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private detectBrowserLanguage(): string | null {
    const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
    const match = this.SUPPORTED_LANGUAGES.find(l => l.code === browserLang);
    return match ? match.code : null;
  }

  private getSavedLanguage(): string | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && this.SUPPORTED_LANGUAGES.find(l => l.code === saved)) {
        return saved;
      }
    } catch { /* localStorage unavailable */ }
    return null;
  }

  private saveLanguage(code: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, code);
    } catch { /* localStorage unavailable */ }
  }

  private applyDirection(dir: 'ltr' | 'rtl'): void {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', this.getCurrentLanguage());
  }
}
