import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';
import { BackButtonService } from './core/services/back-button.service';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslateModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  constructor(
    private langService: LanguageService,
    private backButtonService: BackButtonService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    this.langService.init();
    this.setupBackButton();
  }

  ngOnDestroy() {
    // El listener de App se remueve solo, pero por prolijidad
    // podríamos guardar la referencia y hacer .remove() aquí si Capacitor lo requiere.
  }

  private setupBackButton(): void {
    // Este listener solo tiene sentido corriendo dentro de la app nativa,
    // no en el navegador (ahi el back button del navegador ya funciona solo)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    App.addListener('backButton', () => {
      // 1. ¿Algún componente (ej. chat con conversación abierta) quiere
      //    interceptar el evento? Si devuelve true, no hacemos nada más.
      const consumed = this.backButtonService.handleBack();
      if (consumed) {
        return;
      }

      // 2. ¿El Router tiene historial al que volver?
      const currentUrl = this.router.url;
      const isRootRoute = currentUrl === '/home' || currentUrl === '/' || currentUrl === '/login';

      if (!isRootRoute) {
        this.location.back();
        return;
      }

      // 3. Estamos en la raíz: minimizamos la app en vez de matarla de golpe.
      App.minimizeApp();
    });
  }
}
