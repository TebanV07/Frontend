import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AuthService, FlagService } from '../../../core/services';

interface CountryOption {
  code: string;
  name: string;
}

@Component({
  selector: 'app-country-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './country-setup.component.html',
  styleUrls: ['./country-setup.component.scss']
})
export class CountrySetupComponent implements OnInit {

  /** Emite cuando el usuario confirma su país (o cierra el modal) */
  @Output() completed = new EventEmitter<void>();

  detectedCountryCode: string | null = null;
  detectedCountryName: string | null = null;
  selectedCountryCode = '';
  isLoading = true;
  isSaving = false;
  showManualSelect = false;

  readonly countries: CountryOption[];

  constructor(
    private authService: AuthService,
    public flagService: FlagService
  ) {
    this.countries = this.buildCountryOptions();
  }

  ngOnInit(): void {
    // El backend ya intentó detectar el país durante el login.
    const user = this.authService.getCurrentUser();
    if (user?.country_code) {
      this.detectedCountryCode = user.country_code;
      this.detectedCountryName = this.flagService.getCountryName(user.country_code);
      this.selectedCountryCode = user.country_code;
    }
    this.isLoading = false;
  }

  get flagUrl(): string {
    return this.flagService.getCountryFlagUrl(this.selectedCountryCode || this.detectedCountryCode, 40);
  }

  confirmCountry(): void {
    const code = this.selectedCountryCode || this.detectedCountryCode;
    if (!code) {
      this.showManualSelect = true;
      return;
    }
    this.isSaving = true;
    this.authService.updateCountry(code).subscribe({
      next: () => {
        this.isSaving = false;
        this.completed.emit();
      },
      error: () => {
        this.isSaving = false;
        this.completed.emit(); // cerrar igual para no bloquear
      }
    });
  }

  skipSetup(): void {
    this.completed.emit();
  }

  private buildCountryOptions(): CountryOption[] {
    return [
      'MX', 'ES', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'BO', 'PY',
      'UY', 'BR', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'PT', 'NL',
      'PL', 'RU', 'JP', 'CN', 'KR', 'IN', 'TR', 'SA', 'AU', 'ZA'
    ]
      .map(code => ({
        code,
        name: this.flagService.getCountryName(code)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}


