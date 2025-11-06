import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface QuickAccessItem {
  icon: string;
  text: string;
  route?: string;
  action?: () => void;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  currentUser: any = null;

  quickAccessItems: QuickAccessItem[] = [
    { icon: 'trending', text: 'Tendencias', route: '/trending' },
    { icon: 'videos', text: 'Videos', route: '/videos' },
    { icon: 'live', text: 'En Vivo', route: '/lives' },
    { icon: 'chat', text: 'Mensajes', route: '/chat' },
    { icon: 'profile', text: 'Mi Perfil', route: '/profile' },
    { icon: 'settings', text: 'Configuración', route: '/settings' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Obtener usuario del servicio de autenticación
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }

  navigateTo(route?: string) {
    if (route) {
      this.router.navigate([route]);
    }
  }

  getIconPath(iconType: string): string {
    const icons: { [key: string]: string } = {
      trending: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      videos: 'M23 7l-7 5 7 5V7zM1 5v14a2 2 0 002 2h15a2 2 0 002-2V5a2 2 0 00-2-2H3a2 2 0 00-2 2z',
      live: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 15a5 5 0 110-10 5 5 0 010 10z',
      chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
      profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
      settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z'
    };
    return icons[iconType] || '';
  }
}