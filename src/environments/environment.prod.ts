/**
 * Configuración del entorno de producción
 */

export const environment = {
  production: true,

  // ⭐ CONFIGURA TU GOOGLE CLIENT ID PARA PRODUCCIÓN
  googleClientId: process.env['GOOGLE_CLIENT_ID'] || '259954016870-carbome69mftn4pcfirb31qbc6uqq08v.apps.googleusercontent.com',

  // API Backend
  apiUrl: process.env['API_URL'] || 'https://api.tudominio.com/api/v1',

  // Otros servicios
  maxUploadSizeMB: 100,
  videoFormats: ['mp4', 'webm', 'mkv'],
  imageFormats: ['jpg', 'jpeg', 'png', 'gif']
};
