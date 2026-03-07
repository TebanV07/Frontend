import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  template: `
    <div class="main-layout" [class.dark-theme]="themeService.isDarkMode()">
      <app-header></app-header>
      <div class="layout-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      min-height: 100vh;
      background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);
      transition: background 0.3s ease;

      &.dark-theme {
        background: linear-gradient(to bottom, #0f172a 0%, #1e293b 100%);
      }
    }

    .layout-content {
      padding-top: 70px; // Espacio para el header fixed
      min-height: calc(100vh - 70px);

      @media (max-width: 768px) {
        padding-top: 60px;
      }
    }
  `]
})
export class MainLayoutComponent {
  constructor(public themeService: ThemeService) {}
}
