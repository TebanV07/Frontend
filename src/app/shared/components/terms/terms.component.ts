import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ViewChild, ViewChildren, ElementRef, QueryList,
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

  @ViewChild('termsContent')  termsEl?: ElementRef<HTMLElement>;
  @ViewChild('privacyContent') privacyEl?: ElementRef<HTMLElement>;

  activeTab: 'terms' | 'privacy' = 'terms';

  // Progreso y estado de cada tab
  scrollProgress = 0;
  scrolledToBottom = false;

  // Guardamos si cada tab fue leÃ­do hasta el final
  private tabRead: Record<string, boolean> = { terms: false, privacy: false };

  // Ambos deben haberse leÃ­do para poder aceptar
  get bothRead(): boolean {
    return this.tabRead['terms'] && this.tabRead['privacy'];
  }

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

  switchTab(tab: 'terms' | 'privacy'): void {
    this.activeTab = tab;
    // PequeÃ±o delay para que el DOM muestre el nuevo panel
    setTimeout(() => this.updateScrollState(), 60);
  }

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
      this.scrollProgress = 100;
      this.scrolledToBottom = true;
      this.tabRead[this.activeTab] = true;
    } else {
      const ratio = el.scrollTop / scrollable;
      this.scrollProgress = Math.min(100, Math.round(ratio * 100));
      this.scrolledToBottom = el.scrollTop >= scrollable - 10;
      if (this.scrolledToBottom) this.tabRead[this.activeTab] = true;
    }
  }

  onScroll(_event: Event): void {
    this.updateScrollState();
  }

acceptTerms(): void {
  if (!this.bothRead) return;
  localStorage.setItem('terms_accepted', 'true');
  localStorage.setItem('terms_accepted_date', new Date().toISOString());

  // Verificar siguiente paso
  const permissionsGranted = localStorage.getItem('permissions_granted') === 'true';
  if (!permissionsGranted) {
    this.router.navigate(['/permissions']);
  } else {
    this.router.navigate(['/home']);
  }
}

  declineTerms(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('terms_accepted');
    }
    this.router.navigate(['/login']);
  }
}

