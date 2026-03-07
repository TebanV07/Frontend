import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, FlagService } from '../../../core/services';

interface CountryOption {
  code: string;
  name: string;
}

@Component({
  selector: 'app-country-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  readonly countries: CountryOption[] = [
    { code: 'MX', name: 'México' }, { code: 'ES', name: 'España' },
    { code: 'AR', name: 'Argentina' }, { code: 'CO', name: 'Colombia' },
    { code: 'CL', name: 'Chile' }, { code: 'PE', name: 'Perú' },
    { code: 'VE', name: 'Venezuela' }, { code: 'EC', name: 'Ecuador' },
    { code: 'BO', name: 'Bolivia' }, { code: 'PY', name: 'Paraguay' },
    { code: 'UY', name: 'Uruguay' }, { code: 'BR', name: 'Brasil' },
    { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' }, { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' }, { code: 'IT', name: 'Italy' },
    { code: 'PT', name: 'Portugal' }, { code: 'NL', name: 'Netherlands' },
    { code: 'PL', name: 'Poland' }, { code: 'RU', name: 'Russia' },
    { code: 'JP', name: 'Japan' }, { code: 'CN', name: 'China' },
    { code: 'KR', name: 'South Korea' }, { code: 'IN', name: 'India' },
    { code: 'TR', name: 'Turkey' }, { code: 'SA', name: 'Saudi Arabia' },
    { code: 'AU', name: 'Australia' }, { code: 'ZA', name: 'South Africa' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  constructor(
    private authService: AuthService,
    public flagService: FlagService
  ) {}

  ngOnInit(): void {
    // El backend ya intentó detectar el país durante el login (_postLoginActions).
    // Aquí simplemente leemos lo que tenga el usuario en memoria.
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
}
