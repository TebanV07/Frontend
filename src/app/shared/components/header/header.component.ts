import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationsComponent } from '../../components/notifications/notifications.component';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NotificationsComponent, NotificationsComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  unreadNotifications = 0;

  private destroy$ = new Subject<void>();

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadNotifications = count;
      });
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

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
