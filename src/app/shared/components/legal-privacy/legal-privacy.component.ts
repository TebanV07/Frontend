import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Página PÚBLICA de solo lectura — Política de Privacidad.
 * Sin login, sin stepper. Requerida por Google Auth Platform
 * ("Información de la marca") y accesible para cualquier visitante.
 */
@Component({
  selector: 'app-legal-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legal-privacy.component.html',
  styleUrls: ['./legal-privacy.component.scss']
})
export class LegalPrivacyComponent {}
