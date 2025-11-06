// core/utils/constants.ts

/**
 * Idiomas soportados en la plataforma
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
] as const;

/**
 * Categorías de videos
 */
export const VIDEO_CATEGORIES = [
  { id: 'education', name: 'Educación', icon: '📚' },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎬' },
  { id: 'music', name: 'Música', icon: '🎵' },
  { id: 'sports', name: 'Deportes', icon: '⚽' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'food', name: 'Comida', icon: '🍕' },
  { id: 'travel', name: 'Viajes', icon: '✈️' },
  { id: 'fashion', name: 'Moda', icon: '👗' },
  { id: 'art', name: 'Arte', icon: '🎨' },
  { id: 'tech', name: 'Tecnología', icon: '💻' },
  { id: 'lifestyle', name: 'Estilo de vida', icon: '🌟' },
  { id: 'fitness', name: 'Fitness', icon: '💪' }
] as const;

/**
 * Formatos de video soportados
 */
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime'
] as const;

/**
 * Tamaño máximo de archivos
 */
export const MAX_FILE_SIZES = {
  VIDEO: 500 * 1024 * 1024, // 500 MB
  IMAGE: 10 * 1024 * 1024,  // 10 MB
  AVATAR: 5 * 1024 * 1024   // 5 MB
} as const;

/**
 * Configuración de paginación
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  VIDEO_FEED_SIZE: 10,
  COMMENTS_PAGE_SIZE: 15,
  FOLLOWERS_PAGE_SIZE: 20
} as const;

/**
 * Tiempos de debounce (ms)
 */
export const DEBOUNCE_TIME = {
  SEARCH: 300,
  AUTO_SAVE: 1000,
  SCROLL: 100
} as const;

/**
 * Duración de animaciones (ms)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const;

/**
 * Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu internet.',
  UNAUTHORIZED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error del servidor. Por favor, intenta más tarde.',
  VALIDATION_ERROR: 'Por favor, verifica los datos ingresados.',
  FILE_TOO_LARGE: 'El archivo es demasiado grande.',
  INVALID_FORMAT: 'Formato de archivo no soportado.'
} as const;

/**
 * Rutas de la aplicación
 */
export const APP_ROUTES = {
  LOGIN: '/login',
  HOME: '/home',
  CHAT: '/chat',
  VIDEOS: '/videos',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications'
} as const;

/**
 * Storage keys para localStorage
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CURRENT_USER: 'currentUser',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;