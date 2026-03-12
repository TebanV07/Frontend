import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  geolocation: boolean;
  notifications: boolean;
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  private permissionsSubject = new BehaviorSubject<PermissionStatus>({
    camera: false,
    microphone: false,
    geolocation: false,
    notifications: false
  });

  public permissions$: Observable<PermissionStatus> = this.permissionsSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPermissions();
    }
  }

  private loadPermissions(): void {
    const permissions = this.permissionsSubject.value;

    permissions.camera = localStorage.getItem('permission_camera') === 'true';
    permissions.microphone = localStorage.getItem('permission_microphone') === 'true';
    permissions.geolocation = localStorage.getItem('permission_geolocation') === 'true';
    permissions.notifications = localStorage.getItem('permission_notifications') === 'true';

    this.permissionsSubject.next(permissions);
  }

  getPermission(permissionId: string): boolean {
    return this.permissionsSubject.value[permissionId] ?? false;
  }

  getAll(): PermissionStatus {
    return this.permissionsSubject.value;
  }

  setPermission(permissionId: string, granted: boolean): void {
    const permissions = this.permissionsSubject.value;
    permissions[permissionId] = granted;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(`permission_${permissionId}`, granted ? 'true' : 'false');
    }

    this.permissionsSubject.next(permissions);
  }

  async requestCamera(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      this.setPermission('camera', true);
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      this.setPermission('camera', false);
      return false;
    }
  }

  async requestMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      this.setPermission('microphone', true);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      this.setPermission('microphone', false);
      return false;
    }
  }

  async requestGeolocation(): Promise<boolean> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          this.setPermission('geolocation', true);
          resolve(true);
        },
        () => {
          console.error('Geolocation permission denied');
          this.setPermission('geolocation', false);
          resolve(false);
        }
      );
    });
  }

  async requestNotifications(): Promise<boolean> {
    if (isPlatformBrowser(this.platformId) && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        const granted = result === 'granted';
        this.setPermission('notifications', granted);
        return granted;
      } catch (error) {
        console.error('Notification permission error:', error);
        this.setPermission('notifications', false);
        return false;
      }
    }
    return false;
  }

  hasAcceptedTerms(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return localStorage.getItem('terms_accepted') === 'true';
  }

  setTermsAccepted(accepted: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('terms_accepted', accepted ? 'true' : 'false');
  }

  hasConfiguredPermissions(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return localStorage.getItem('permissions_granted') === 'true';
  }

  setPermissionsConfigured(configured: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('permissions_granted', configured ? 'true' : 'false');
  }
}
