import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Página PÚBLICA de solo lectura — Términos y Condiciones.
 * Sin login, sin stepper, sin lógica de aceptación.
 * Usada para revisión de Google Auth Platform y como referencia legal
 * accesible para cualquiera (usuarios, invitados, revisores).
 *
 * El flujo de ACEPTACIÓN dentro del onboarding sigue viviendo en
 * TermsComponent (/terms) — este componente NO lo reemplaza.
 */
@Component({
  selector: 'app-legal-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legal-terms.component.html',
  styleUrls: ['./legal-terms.component.scss']
})
export class LegalTermsComponent {}
