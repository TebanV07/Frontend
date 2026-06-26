import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ViewChild, ElementRef,
  Inject, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('termsContent')   termsEl?: ElementRef<HTMLElement>;
  @ViewChild('privacyContent') privacyEl?: ElementRef<HTMLElement>;

  activeTab: 'terms' | 'privacy' = 'terms';

  scrollProgress   = 0;
  scrolledToBottom = false;

  // Public so the template can access tabRead['terms'] / tabRead['privacy']
  tabRead: Record<string, boolean> = { terms: false, privacy: false };

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (localStorage.getItem('terms_accepted') === 'true') {
      this.router.navigate(['/home']);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => this.updateScrollState(), 80);
    window.addEventListener('resize', this.onResizeBound);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.removeEventListener('resize', this.onResizeBound);
  }

  private onResizeBound = () => this.updateScrollState();

  // ── Internal helpers ───────────────────────────────────────

  private getActiveEl(): HTMLElement | null {
    return this.activeTab === 'terms'
      ? (this.termsEl?.nativeElement ?? null)
      : (this.privacyEl?.nativeElement ?? null);
  }

  private updateScrollState(): void {
    const el = this.getActiveEl();
    if (!el) return;

    const scrollable = el.scrollHeight - el.clientHeight;

    if (scrollable <= 5) {
      this.scrollProgress   = 100;
      this.scrolledToBottom = true;
      this.tabRead[this.activeTab] = true;
    } else {
      const ratio = el.scrollTop / scrollable;
      this.scrollProgress   = Math.min(100, Math.round(ratio * 100));
      this.scrolledToBottom = el.scrollTop >= scrollable - 10;
      if (this.scrolledToBottom) this.tabRead[this.activeTab] = true;
    }
  }

  private switchToTab(tab: 'terms' | 'privacy'): void {
    this.activeTab = tab;
    // Reset progress bar for the new tab
    this.scrollProgress   = this.tabRead[tab] ? 100 : 0;
    this.scrolledToBottom = this.tabRead[tab];
    // Let the DOM show the new panel, then re-measure
    setTimeout(() => this.updateScrollState(), 60);
  }

  // ── Public (template) ─────────────────────────────────────

  onScroll(_event: Event): void {
    this.updateScrollState();
  }

  /**
   * Called by the "Continuar a Privacidad" button (step 1).
   * Only active once the Terms content has been scrolled to bottom.
   */
  nextStep(): void {
    if (!this.scrolledToBottom) return;
    this.switchToTab('privacy');
    // Scroll the privacy panel to top so the user starts fresh
    setTimeout(() => {
      const el = this.privacyEl?.nativeElement;
      if (el) el.scrollTop = 0;
      this.updateScrollState();
    }, 80);
  }

  /**
   * Called by the "Aceptar" button (step 2 / Privacy tab).
   * Only active once the Privacy content has been scrolled to bottom.
   */
  acceptTerms(): void {
    if (!this.scrolledToBottom) return;
    localStorage.setItem('terms_accepted', 'true');
    localStorage.setItem('terms_accepted_date', new Date().toISOString());

    const permissionsGranted = localStorage.getItem('permissions_granted') === 'true';
    this.router.navigate([permissionsGranted ? '/home' : '/permissions']);
  }

  declineTerms(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('terms_accepted');
    }
    this.router.navigate(['/login']);
  }
}
