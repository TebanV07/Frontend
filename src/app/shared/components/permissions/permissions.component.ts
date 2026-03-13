import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

export interface Permission {
  id: string;
  name: string;
  icon: string;
  description: string;
  granted: boolean;
  required: boolean;
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss']
})
export class PermissionsComponent implements OnInit {

  step: 'welcome' | 'permissions' | 'complete' = 'welcome';
  permissions: Permission[] = [
    {
      id: 'camera',
      name: 'Cámara',
      icon: '??',
      description: 'Necesitamos acceso a tu cámara para transmisiones en vivo y videollamadas',
      granted: false,
      required: false
    },
    {
      id: 'microphone',
      name: 'Micrófono',
      icon: '??',
      description: 'Acceso a tu micrófono para audio en videollamadas y transmisiones',
      granted: false,
      required: false
    },
    {
      id: 'geolocation',
      name: 'Ubicación',
      icon: '??',
      description: 'Opcional: para localizar eventos y encuentros cercanos',
      granted: false,
      required: false
    },
    {
      id: 'notifications',
      name: 'Notificaciones',
      icon: '??',
      description: 'Recibe notificaciones sobre mensajes, comentarios y menciones',
      granted: false,
      required: true
    }
  ];

  constructor(public router: Router) {}

  ngOnInit(): void {
    const permissionsGranted = localStorage.getItem('permissions_granted');
    if (permissionsGranted === 'true') {
      this.step = 'complete';
    }
  }

  /**
    * Solicitar permiso específico.
   */
  async requestPermission(permission: Permission): Promise<void> {
    try {
      switch (permission.id) {
        case 'camera':
          await this.requestCameraPermission(permission);
          break;
        case 'microphone':
          await this.requestMicrophonePermission(permission);
          break;
        case 'geolocation':
          await this.requestGeolocationPermission(permission);
          break;
        case 'notifications':
          await this.requestNotificationsPermission(permission);
          break;
      }
    } catch (error) {
      console.error(`Error requesting ${permission.name} permission:`, error);
    }
  }

  /**
    * Solicitar permiso de cámara.
   */
  private async requestCameraPermission(permission: Permission): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      permission.granted = true;
      this.savePermissionPreference('camera', true);
    } catch (error) {
      console.error('Camera permission denied:', error);
      permission.granted = false;
    }
  }

  /**
    * Solicitar permiso de micrófono.
   */
  private async requestMicrophonePermission(permission: Permission): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      permission.granted = true;
      this.savePermissionPreference('microphone', true);
    } catch (error) {
      console.error('Microphone permission denied:', error);
      permission.granted = false;
    }
  }

  /**
    * Solicitar permiso de ubicación.
   */
  private async requestGeolocationPermission(permission: Permission): Promise<void> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          permission.granted = true;
          this.savePermissionPreference('geolocation', true);
          resolve();
        },
        () => {
          console.error('Geolocation permission denied');
          permission.granted = false;
          resolve();
        }
      );
    });
  }

  /**
   * Solicitar permiso de notificaciones
   */
  private async requestNotificationsPermission(permission: Permission): Promise<void> {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        permission.granted = result === 'granted';
        this.savePermissionPreference('notifications', permission.granted);
      } catch (error) {
        console.error('Notification permission error:', error);
        permission.granted = false;
      }
    }
  }

  /**
   * Guardar preferencia de permiso en localStorage.
   */
  private savePermissionPreference(permissionId: string, granted: boolean): void {
    localStorage.setItem(`permission_${permissionId}`, granted ? 'true' : 'false');
  }

  /**
   * Solicitar todos los permisos.
   */
  async requestAllPermissions(): Promise<void> {
    for (const permission of this.permissions) {
      await this.requestPermission(permission);
    }
    this.completePermissions();
  }

  /**
    * Saltar permisos opcionales.
   */
  skipOptionalPermissions(): void {
    // Marcar solo los obligatorios como solicitados
    const requiredPermission = this.permissions.find(p => p.required);
    if (requiredPermission) {
      this.requestPermission(requiredPermission);
    }
    this.completePermissions();
  }

  /**
    * Completar y guardar.
   */
  completePermissions(): void {
    localStorage.setItem('permissions_granted', 'true');
    this.step = 'complete';
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 2000);
  }
}


