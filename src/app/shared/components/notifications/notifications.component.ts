import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;
  showDropdown = false;
  isMarkingAsRead = false;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Cargar notificaciones
    this.loadNotifications();

    // Suscribirse a cambios de notificaciones
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });

    // Suscribirse a cambios de contador
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });

    // Activar polling
    this.notificationService.setPollingActive(true);
  }

  ngOnDestroy(): void {
    this.notificationService.setPollingActive(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar notificaciones desde el servidor
   */
  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.getNotifications(0, 20, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notifications = response.notifications;
          this.unreadCount = response.unread_count;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando notificaciones:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Toggle dropdown de notificaciones
   */
  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadNotifications();
    }
  }

  /**
   * Cerrar dropdown
   */
  closeDropdown(): void {
    this.showDropdown = false;
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (notification.is_read) return;

    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => console.error('Error marcando como leída:', error)
      });
  }

  /**
   * Marcar todas como leídas
   */
  markAllAsRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.isMarkingAsRead = true;
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.unreadCount = 0;
          this.isMarkingAsRead = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.isMarkingAsRead = false;
        }
      });
  }

  /**
   * Eliminar notificación
   */
  deleteNotification(notification: Notification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.notificationService.deleteNotification(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => console.error('Error eliminando:', error)
      });
  }

  /**
   * Limpiar todas las notificaciones
   */
  clearAll(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (confirm('¿Estás seguro de que deseas eliminar todas las notificaciones?')) {
      this.notificationService.clearAll()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notifications = [];
            this.unreadCount = 0;
          },
          error: (error) => console.error('Error:', error)
        });
    }
  }

  /**
   * Navegar a la página relevante según el tipo de notificación
   */
  handleNotificationClick(notification: Notification): void {
    this.markAsRead(notification);

    switch (notification.type) {
      case 'follow_request':
        this.router.navigate(['/profile', 'follow-requests']);
        break;

      case 'follow_accepted':
      case 'post_from_follow':
      case 'repost_from_follow':
        if (notification.from_user) {
          this.router.navigate(['/profile', notification.from_user.username]);
        }
        break;

      case 'new_message':
        if (notification.data && notification.data['conversation_id']) {
          this.router.navigate(['/chat', notification.data['conversation_id']]);
        }
        break;

      case 'like_on_post':
      case 'comment_on_post':
        if (notification.reference_id && notification.reference_type === 'post') {
          this.router.navigate(['/posts', notification.reference_id]);
        }
        break;

      default:
        console.log('Tipo de notificación no manejado:', notification.type);
    }

    this.closeDropdown();
  }

  /**
   * Obtener icono según tipo de notificación
   */
  getNotificationIcon(notification: Notification): string {
    switch (notification.type) {
      case 'follow_request':
        return '👤'; // Usuario
      case 'follow_accepted':
        return '✅'; // Aprobado
      case 'new_message':
        return '💬'; // Mensaje
      case 'post_from_follow':
      case 'repost_from_follow':
        return '📝'; // Post
      case 'like_on_post':
        return '❤️'; // Like
      case 'comment_on_post':
        return '💭'; // Comentario
      default:
        return '🔔'; // Campana por defecto
    }
  }

  /**
   * Obtener texto de tiempo relativo
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
}
