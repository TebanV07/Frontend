import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, tap, switchMap, filter } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Notification {
  id: number;
  type: string; // 'follow_request', 'follow_accepted', 'new_message', 'post_from_follow', etc
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  reference_id?: number;
  reference_type?: string; // 'post', 'video', 'message', 'follow_request'
  data?: Record<string, any>;
  from_user?: {
    id: number;
    username: string;
    avatar?: string;
    name?: string;
  };
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;

  // Subjects para RxJS
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private newNotificationSubject = new Subject<Notification>();

  // Observables públicos
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public newNotification$ = this.newNotificationSubject.asObservable();

  // Control de polling
  private pollingActive = false;
  private pollingStarted = false; // ← evita arrancar el intervalo dos veces
  private pollingInterval = 30000; // 30 segundos

  constructor(private http: HttpClient) {
    // ✅ NO iniciamos polling aquí.
    // AuthService llama startPolling() después de verificar la sesión.
  }

  // ============================================================
  // CONTROL DE POLLING
  // ============================================================

  /**
   * Arranca el polling. Lo llama AuthService después de verificar la sesión.
   * Es seguro llamarlo varias veces — pollingStarted previene doble arranque.
   */
  startPolling(): void {
    if (!localStorage.getItem('access_token')) return;

    this.pollingActive = true;

    // Carga inmediata al arrancar
    this.loadNotifications().subscribe({
      next: () => {},
      error: err => console.error('Error inicial cargando notificaciones:', err)
    });

    // Arrancar el intervalo solo una vez
    if (this.pollingStarted) return;
    this.pollingStarted = true;

    interval(this.pollingInterval)
      .pipe(
        filter(() => this.pollingActive && !!localStorage.getItem('access_token')),
        switchMap(() => this.getNotifications(0, 20, false))
      )
      .subscribe({
        next: (response) => {
          this.notificationsSubject.next(response.notifications);
          this.unreadCountSubject.next(response.unread_count);
        },
        error: (error) => console.error('Error en polling:', error)
      });
  }

  /**
   * Activar/desactivar polling
   */
  setPollingActive(active: boolean): void {
    this.pollingActive = active;
    if (active && localStorage.getItem('access_token')) {
      this.loadNotifications().subscribe({
        next: () => {},
        error: err => console.error('Error cargando notificaciones:', err)
      });
    }
  }

  // ============================================================
  // CRUD DE NOTIFICACIONES
  // ============================================================

  /**
   * Cargar notificaciones
   */
  loadNotifications(skip: number = 0, limit: number = 20, unreadOnly: boolean = false): Observable<NotificationListResponse> {
    return this.getNotifications(skip, limit, unreadOnly).pipe(
      tap((response) => {
        this.notificationsSubject.next(response.notifications);
        this.unreadCountSubject.next(response.unread_count);
      })
    );
  }

  /**
   * Obtener notificaciones del servidor
   */
  getNotifications(skip: number = 0, limit: number = 20, unreadOnly: boolean = false): Observable<NotificationListResponse> {
    const headers = this.getAuthHeaders();

    return this.http.get<NotificationListResponse>(
      `${this.apiUrl}/notifications`,
      {
        headers,
        params: {
          skip: skip.toString(),
          limit: limit.toString(),
          unread_only: unreadOnly ? 'true' : 'false'
        }
      }
    ).pipe(
      catchError((error) => {
        console.error('Error obteniendo notificaciones:', error);
        return of({
          notifications: [],
          total: 0,
          unread_count: 0,
          page: 1,
          pageSize: limit,
          hasMore: false
        });
      })
    );
  }

  /**
   * Obtener cantidad de notificaciones no leídas
   */
  getUnreadCount(): Observable<{ unread_count: number; has_unread: boolean }> {
    const headers = this.getAuthHeaders();

    return this.http.get<any>(
      `${this.apiUrl}/notifications/unread/count`,
      { headers }
    ).pipe(
      tap((response) => {
        this.unreadCountSubject.next(response.unread_count);
      }),
      catchError((error) => {
        console.error('Error obteniendo count:', error);
        return of({ unread_count: 0, has_unread: false });
      })
    );
  }

  /**
   * Obtener notificación específica
   */
  getNotification(notificationId: number): Observable<Notification> {
    const headers = this.getAuthHeaders();

    return this.http.get<Notification>(
      `${this.apiUrl}/notifications/${notificationId}`,
      { headers }
    ).pipe(
      catchError((error) => {
        console.error('Error obteniendo notificación:', error);
        throw error;
      })
    );
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(notificationId: number): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      `${this.apiUrl}/notifications/mark-read/${notificationId}`,
      {},
      { headers }
    ).pipe(
      tap(() => {
        this.updateLocalNotificationReadStatus(notificationId, true);
      }),
      catchError((error) => {
        console.error('Error marcando como leída:', error);
        return of(null);
      })
    );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  markAllAsRead(): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      `${this.apiUrl}/notifications/mark-all-read`,
      {},
      { headers }
    ).pipe(
      tap(() => {
        const current = this.notificationsSubject.value;
        current.forEach(n => n.is_read = true);
        this.notificationsSubject.next([...current]);
        this.unreadCountSubject.next(0);
      }),
      catchError((error) => {
        console.error('Error marcando todo como leído:', error);
        return of(null);
      })
    );
  }

  /**
   * Eliminar notificación
   */
  deleteNotification(notificationId: number): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.delete<any>(
      `${this.apiUrl}/notifications/${notificationId}`,
      { headers }
    ).pipe(
      tap(() => {
        this.removeLocalNotification(notificationId);
      }),
      catchError((error) => {
        console.error('Error eliminando notificación:', error);
        return of(null);
      })
    );
  }

  /**
   * Eliminar todas las notificaciones
   */
  clearAll(): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      `${this.apiUrl}/notifications/clear-all`,
      {},
      { headers }
    ).pipe(
      tap(() => {
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }),
      catchError((error) => {
        console.error('Error limpiando notificaciones:', error);
        return of(null);
      })
    );
  }

  /**
   * Agregar notificación localmente (para WebSocket)
   */
  addNotificationLocally(notification: Notification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);

    // Incrementar contador de no leídas
    const unread = this.unreadCountSubject.value;
    this.unreadCountSubject.next(unread + 1);

    // Emitir evento de nueva notificación
    this.newNotificationSubject.next(notification);
  }

  /**
   * Actualizar estado de lectura localmente
   */
  private updateLocalNotificationReadStatus(notificationId: number, isRead: boolean): void {
    const current = this.notificationsSubject.value;
    const notification = current.find(n => n.id === notificationId);

    if (notification) {
      notification.is_read = isRead;
      this.notificationsSubject.next([...current]);

      // Recalcular no leídas
      const unreadCount = current.filter(n => !n.is_read).length;
      this.unreadCountSubject.next(unreadCount);
    }
  }

  /**
   * Eliminar notificación localmente
   */
  private removeLocalNotification(notificationId: number): void {
    const current = this.notificationsSubject.value;
    const filtered = current.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(filtered);

    // Recalcular no leídas
    const unreadCount = filtered.filter(n => !n.is_read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Obtener headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Emitir notificación por navegador (usando Web Notifications API)
   */
  showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationOptions: NotificationOptions = {
        body: notification.message || '',
        icon: notification.from_user?.avatar,
        badge: 'assets/logo.png',
        tag: `notification-${notification.id}`,
        requireInteraction: false
      };

      if (notification.from_user) {
        notificationOptions.body = `${notification.from_user.username}: ${notification.message || ''}`;
      }

      new Notification(notification.title, notificationOptions);
    }
  }

  /**
   * Destructor
   */
  ngOnDestroy(): void {
    this.setPollingActive(false);
  }
}
