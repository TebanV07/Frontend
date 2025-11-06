/**
 * Interface principal de Usuario
 * Representa un usuario completo del sistema
 */
export interface User {
  // Identificación básica
  id: number;
  username: string;
  email?: string; // Opcional ya que no siempre se expone públicamente
  
  // Información personal
  firstName?: string;
  lastName?: string;
  nativeLanguage?: string;
  
  // Perfil social
  name?: string; // Nombre para mostrar
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  
  // Estadísticas del perfil
  followers: number;
  following: number;
  postsCount?: number;
  videosCount?: number;
  
  // Estado del usuario
  isActive?: boolean;
  isVerified?: boolean;
  isOnline?: boolean; // Para mostrar estado en tiempo real
  
  // Relación con el usuario actual (calculado en frontend)
  isFollowing?: boolean;
  isBlocked?: boolean;
  isMuted?: boolean;
  
  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastLogin?: Date | string;
}

/**
 * Interface extendida para el usuario autenticado actual
 * Incluye información privada adicional
 */
export interface CurrentUser extends User {
  // Sobrescribimos para que email sea requerido en el usuario actual
  email: string;
  
  // Configuraciones privadas
  notificationsEnabled?: boolean;
  privateAccount?: boolean;
  twoFactorEnabled?: boolean;
  emailNotifications?: boolean;
  
  // Preferencias
  theme?: 'light' | 'dark' | 'auto';
  autoTranslate?: boolean;
  preferredTranslationLanguage?: string;
}

/**
 * Interface simplificada para listas y búsquedas
 * Optimizada para performance y coincide con el uso en video-feed
 */
export interface UserBasic {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;

  followers_count: number;
  following_count: number;
  posts_count?: number;
  videos_count?: number;

  is_active?: boolean;
  is_verified?: boolean;
  last_activity?: string;

  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

/**
 * DTO para actualizar perfil de usuario
 */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  website?: string;
  location?: string;
  nativeLanguage?: string;
  avatar?: string;
}

/**
 * DTO para configuraciones de usuario
 */
export interface UserSettingsDto {
  notificationsEnabled?: boolean;
  privateAccount?: boolean;
  emailNotifications?: boolean;
  autoTranslate?: boolean;
  preferredTranslationLanguage?: string;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Interface para seguimiento de usuarios
 */
export interface UserFollow {
  followerId: number;
  followingId: number;
  createdAt: Date | string;
}

/**
 * Response para lista de seguidores/siguiendo
 */
export interface FollowListResponse {
  users: UserBasic[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}