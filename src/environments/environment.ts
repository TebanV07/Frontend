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
  googleClientId: 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID',

  // API Backend
  apiUrl: 'http://localhost:8001/api/v1',

  // Otros servicios
  maxUploadSizeMB: 100,
  videoFormats: ['mp4', 'webm', 'mkv'],
  imageFormats: ['jpg', 'jpeg', 'png', 'gif']
};
