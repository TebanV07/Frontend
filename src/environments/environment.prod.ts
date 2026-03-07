/**
 * Configuración del entorno de producción
 */

export const environment = {
  production: true,

  // ⭐ CONFIGURA TU GOOGLE CLIENT ID PARA PRODUCCIÓN
  googleClientId: process.env['GOOGLE_CLIENT_ID'] || 'REPLACE_WITH_PRODUCTION_GOOGLE_CLIENT_ID',

  // API Backend
  apiUrl: process.env['API_URL'] || 'https://api.tudominio.com/api/v1',

  // Otros servicios
  maxUploadSizeMB: 100,
  videoFormats: ['mp4', 'webm', 'mkv'],
  imageFormats: ['jpg', 'jpeg', 'png', 'gif']
};
