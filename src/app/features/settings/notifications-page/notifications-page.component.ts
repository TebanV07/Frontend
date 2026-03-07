import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss']
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;
  currentPage = 1;
  pageSize = 20;
  totalNotifications = 0;
  filter: 'all' | 'unread' = 'all';

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Cargar filtro desde query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.filter = params['filter'] || 'all';
        this.loadNotifications();
      });

    // Cargar contador de no leídas
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: number) => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar notificaciones
   */
  loadNotifications(): void {
    this.isLoading = true;
    const skip = (this.currentPage - 1) * this.pageSize;
    const unreadOnly = this.filter === 'unread';

    this.notificationService.getNotifications(skip, this.pageSize, unreadOnly)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.notifications = response.notifications;
          this.totalNotifications = response.total;
          this.unreadCount = response.unread_count;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error cargando notificaciones:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Cambiar filtro
   */
  setFilter(filter: 'all' | 'unread'): void {
    if (this.filter !== filter) {
      this.filter = filter;
      this.currentPage = 1;
      this.loadNotifications();
    }
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(notification: Notification): void {
    if (notification.is_read) return;

    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error: any) => console.error('Error:', error)
      });
  }

  /**
   * Marcar todas como leídas
   */
  markAllAsRead(): void {
    if (this.unreadCount === 0) return;

    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
          this.unreadCount = 0;
        },
        error: (error: any) => console.error('Error:', error)
      });
  }

  /**
   * Eliminar notificación
   */
  deleteNotification(notification: Notification): void {
    this.notificationService.deleteNotification(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          this.totalNotifications--;
        },
        error: (error: any) => console.error('Error:', error)
      });
  }

  /**
   * Limpiar todas
   */
  clearAll(): void {
    if (confirm('¿Estás seguro de que deseas eliminar todas las notificaciones?')) {
      this.notificationService.clearAll()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notifications = [];
            this.totalNotifications = 0;
            this.unreadCount = 0;
          },
          error: (error: any) => console.error('Error:', error)
        });
    }
  }

  /**
   * Ir a página
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.loadNotifications();
    }
  }

  /**
   * Obtener total de páginas
   */
  getTotalPages(): number {
    return Math.ceil(this.totalNotifications / this.pageSize);
  }

  /**
   * Obtener páginas disponibles para paginación
   */
  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(total, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Obtener tiempo relativo
   */
  getTimeAgo(date: string): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)}d`;

    return notificationDate.toLocaleDateString();
  }

  /**
   * Obtener icono
   */
  getNotificationIcon(notification: Notification): string {
    const icons: Record<string, string> = {
      'follow_request': '👤',
      'follow_accepted': '✅',
      'new_message': '💬',
      'post_from_follow': '📝',
      'repost_from_follow': '🔄',
      'like_on_post': '❤️',
      'comment_on_post': '💭',
      'default': '🔔'
    };

    return icons[notification.type] || icons['default'];
  }
}
