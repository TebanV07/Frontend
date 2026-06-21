import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationsComponent } from '../../components/notifications/notifications.component';
import { CreditService, CreditTransaction } from '../../../core/services/credit.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NotificationsComponent, NotificationsComponent, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
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

  ngOnInit() {
  this.notificationService.unreadCount$
    .pipe(takeUntil(this.destroy$))
    .subscribe(count => {
      this.unreadNotifications = count;
    });

  this.loadCreditBalance();
}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.mobileMenuOpen = false;
  }

  navigateToNotifications() {
    this.router.navigate(['/notifications']);
    this.mobileMenuOpen = false;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  loadCreditBalance(): void {
  this.creditService.getBalance()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.creditBalance = res.credit_balance;
      },
      error: (err) => {
        console.error('Error al cargar saldo de créditos:', err);
        this.creditBalance = null;
      }
    });
}

toggleCreditMenu(): void {
  this.isCreditMenuOpen = !this.isCreditMenuOpen;
  if (this.isCreditMenuOpen && this.creditHistory.length === 0) {
    this.loadCreditHistory();
  }
}

loadCreditHistory(): void {
  this.isLoadingCreditHistory = true;
  this.creditHistoryError = null;

  this.creditService.getHistory(20)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (transactions) => {
        this.creditHistory = transactions;
        this.isLoadingCreditHistory = false;
      },
      error: (err) => {
        console.error('Error al cargar historial de créditos:', err);
        this.creditHistoryError = 'No se pudo cargar el historial.';
        this.isLoadingCreditHistory = false;
      }
    });
}

  closeCreditMenu(): void {
    this.isCreditMenuOpen = false;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}


