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
    .layout-content {
      /* Antes: 74px fijo, más que la altura real del header
         (56px en móvil) -> sobraba espacio en blanco.
         Ahora queda atado a la variable real + un pequeño gap. */
      padding-top: calc(var(--header-height) + env(safe-area-inset-top, 0px) + 10px);
    }
  }
`]
})
export class MainLayoutComponent {
  constructor(public themeService: ThemeService) {}
}
