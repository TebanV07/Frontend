import { Component, OnInit, OnDestroy, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationsComponent } from '../../components/notifications/notifications.component';
import { CreditService, CreditTransaction } from '../../../core/services/credit.service';

const POLL_MS = 60_000;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NotificationsComponent, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  // 👇 referencia al div .credit-widget del template
  @ViewChild('creditWidget') creditWidgetRef!: ElementRef;

  mobileMenuOpen = false;
  creditBalance: number | null = null;
  creditHistory: CreditTransaction[] = [];
  isCreditMenuOpen = false;
  isLoadingCreditHistory = false;
  creditHistoryError: string | null = null;
  unreadNotifications = 0;

  private destroy$ = new Subject<void>();

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private creditService: CreditService,
    private notificationService: NotificationService
  ) {}

  // ── Click-outside sin directiva ───────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.isCreditMenuOpen &&
      this.creditWidgetRef &&
      !this.creditWidgetRef.nativeElement.contains(event.target)
    ) {
      this.isCreditMenuOpen = false;
    }
  }

  // ── Lifecycle ─────────────────────────────────
  ngOnInit(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => (this.unreadNotifications = count));

    // Carga inmediata + polling cada 60 s
    interval(POLL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.creditService.getBalance()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: res => (this.creditBalance = res.credit_balance),
        error: err => {
          console.error('Error al cargar saldo:', err);
          this.creditBalance = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Navegación ────────────────────────────────
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.mobileMenuOpen = false;
  }

  navigateToNotifications(): void {
    this.router.navigate(['/notifications']);
    this.mobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  // ── Créditos ──────────────────────────────────
  toggleCreditMenu(): void {
    this.isCreditMenuOpen = !this.isCreditMenuOpen;

    // Siempre refresca el historial al abrir
    if (this.isCreditMenuOpen) {
      this.loadCreditHistory();
    }
  }

  closeCreditMenu(): void {
    this.isCreditMenuOpen = false;
  }

  loadCreditHistory(): void {
    this.isLoadingCreditHistory = true;
    this.creditHistoryError = null;

    this.creditService.getHistory(20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: transactions => {
          this.creditHistory = transactions;
          this.isLoadingCreditHistory = false;
        },
        error: err => {
          console.error('Error al cargar historial:', err);
          this.creditHistoryError = 'No se pudo cargar el historial.';
          this.isLoadingCreditHistory = false;
        }
      });
  }
}
