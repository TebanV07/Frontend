import { Injectable } from '@angular/core';

/**
 * Servicio utilitario para banderas de países e idiomas.
 * Usar en posts, videos, mensajes y traducciones.
 *
 * Usa flagcdn.com — sin instalar paquetes.
 * Ejemplo: https://flagcdn.com/w20/mx.png  → bandera México 20px
 */
@Injectable({ providedIn: 'root' })
export class FlagService {

  // Mapa idioma → código de país (para banderas de traducción)
  private readonly LANGUAGE_TO_COUNTRY: Record<string, string> = {
    'en': 'gb',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'pt': 'br',
    'ru': 'ru',
    'zh': 'cn',
    'ja': 'jp',
    'ko': 'kr',
    'ar': 'sa',
    'hi': 'in',
    'nl': 'nl',
    'pl': 'pl',
    'tr': 'tr',
    'uk': 'ua',
    'sv': 'se',
    'no': 'no',
    'da': 'dk',
    'fi': 'fi',
  };

  private readonly LANGUAGE_NAMES: Record<string, string> = {
    'en': 'English', 'es': 'Español', 'fr': 'Français', 'de': 'Deutsch',
    'it': 'Italiano', 'pt': 'Português', 'ru': 'Русский', 'zh': '中文',
    'ja': '日本語', 'ko': '한국어', 'ar': 'العربية', 'hi': 'हिन्दी',
    'nl': 'Nederlands', 'pl': 'Polski', 'tr': 'Türkçe', 'uk': 'Українська',
    'sv': 'Svenska', 'no': 'Norsk', 'da': 'Dansk', 'fi': 'Suomi',
  };

  private readonly COUNTRY_NAMES: Record<string, string> = {
    'mx': 'México', 'es': 'España', 'us': 'United States', 'ar': 'Argentina',
    'co': 'Colombia', 'cl': 'Chile', 'pe': 'Perú', 've': 'Venezuela',
    'ec': 'Ecuador', 'bo': 'Bolivia', 'py': 'Paraguay', 'uy': 'Uruguay',
    'br': 'Brasil', 'fr': 'France', 'de': 'Germany', 'it': 'Italy',
    'gb': 'United Kingdom', 'jp': 'Japan', 'cn': 'China', 'kr': 'South Korea',
    'ru': 'Russia', 'in': 'India', 'sa': 'Saudi Arabia', 'tr': 'Turkey',
    'nl': 'Netherlands', 'pl': 'Poland', 'pt': 'Portugal', 'ca': 'Canada',
    'au': 'Australia', 'za': 'South Africa',
  };

  /**
   * URL de la bandera de un PAÍS (usar en perfil, posts, mensajes)
   * @param countryCode Código ISO-3166 alpha-2, ej: "MX", "ES"
   * @param width Ancho en px (20 | 40 | 80 | 160)
   */
  getCountryFlagUrl(countryCode: string | null | undefined, width: 20 | 40 | 80 | 160 = 20): string {
    if (!countryCode) return '';
    return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
  }

  /**
   * URL de la bandera representativa de un IDIOMA (usar en traducciones)
   * @param languageCode Código ISO-639-1, ej: "en", "es"
   * @param width Ancho en px
   */
  getLanguageFlagUrl(languageCode: string | null | undefined, width: 20 | 40 | 80 | 160 = 20): string {
    if (!languageCode) return '';
    const countryCode = this.LANGUAGE_TO_COUNTRY[languageCode.toLowerCase()] || languageCode.toLowerCase();
    return `https://flagcdn.com/w${width}/${countryCode}.png`;
  }

  /** Nombre del país a partir del código */
  getCountryName(countryCode: string | null | undefined): string {
    if (!countryCode) return '';
    return this.COUNTRY_NAMES[countryCode.toLowerCase()] || countryCode.toUpperCase();
  }

  /** Nombre del idioma a partir del código */
  getLanguageName(languageCode: string | null | undefined): string {
    if (!languageCode) return '';
    return this.LANGUAGE_NAMES[languageCode.toLowerCase()] || languageCode.toUpperCase();
  }

  /** ¿Tiene el usuario país configurado? */
  hasCountry(countryCode: string | null | undefined): boolean {
    return !!countryCode && countryCode.trim().length === 2;
  }
}

