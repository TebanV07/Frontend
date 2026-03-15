/**
 * Configuración del entorno de desarrollo
 *
 * IMPORTANTE:
 * - Configura GOOGLE_CLIENT_ID con tu valor real de Google Cloud Console
 * - Puede ser reemplazado en producción por environment.prod.ts
 */

export const environment = {
  production: false,

  // ⭐ CONFIGURA TU GOOGLE CLIENT ID AQUÍ
  // Obtén este valor desde: https://console.cloud.google.com/apis/credentials
  // Debe estar configurado en las "Authorized JavaScript origins" y "Authorized redirect URIs"
  googleClientId: '259954016870-carbome69mftn4pcfirb31qbc6uqq08v.apps.googleusercontent.com',

  // API Backend
  apiUrl: 'https://web-production-94f95.up.railway.app/api/v1',
  apiBaseUrl: 'https://web-production-94f95.up.railway.app',

  // Otros servicios
  maxUploadSizeMB: 100,
  videoFormats: ['mp4', 'webm', 'mkv'],
  imageFormats: ['jpg', 'jpeg', 'png', 'gif']
};

