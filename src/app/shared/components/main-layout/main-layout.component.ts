import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, TranslateModule],
  template: `
    <div class="main-layout">
      <app-header></app-header>
      <div class="layout-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
 styles: [`
  .main-layout {
    background: transparent !important;
    min-height: 100vh;
    width: 100%;
    position: relative;
  }

  .layout-content {
    padding-top: 82px;
    background: transparent !important;
    min-height: calc(100vh - var(--header-height));
    width: 100%;
  }

  @media (max-width: 768px) {
    .layout-content { padding-top: 74px; }
  }
`]
})
export class MainLayoutComponent {
  constructor(public themeService: ThemeService) {}
}
