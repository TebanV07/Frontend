import { UserBasic } from './user.model';

/**
 * Interface principal de Video
 * Representa un video estilo Reels/TikTok
 */
export interface Video {
  // Identificación
  id: number;
  uuid: string; // UUID para URLs públicas

  // Contenido
  videoUrl: string;
  thumbnailUrl: string;
  title?: string;
  description?: string;

  // Metadata del video
  duration: number; // en segundos
  width: number;
  height: number;
  aspectRatio: string; // ej: '9:16', '1:1'
  orientation?: 'vertical' | 'horizontal' | 'square';
  fileSize?: number; // en bytes
  format?: string; // mp4, webm, etc

  // Usuario creador
  userId: number;
  user: UserBasic;

  // Idioma y traducción
  originalLanguage: string;
  availableLanguages: string[]; // Idiomas con traducción disponible
  hasSubtitles: boolean;
  hasAudioTranslation: boolean;

  // Interacciones
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  savesCount: number;

  // Estado del usuario actual con este video
  isLiked?: boolean;
  isSaved?: boolean;
  hasCommented?: boolean;

  // Visibilidad y moderación
  isPublic: boolean;
  isActive: boolean;
  isFeatured?: boolean;

  // Categorización
  tags?: string[];
  category?: string;
  location?: VideoLocation;
  music?: VideoMusic;

  // Timestamps
  createdAt: Date | string;
  updatedAt?: Date | string;
  publishedAt?: Date | string;
}

/**
 * Interface para subtítulos del video
 */
export interface VideoSubtitle {
  id: number;
  videoId: number;
  language: string;
  subtitleUrl: string; // URL del archivo .vtt o .srt
  isAiGenerated: boolean;
  createdAt: Date | string;
}

/**
 * Interface para audio traducido
 */
export interface VideoAudioTranslation {
  id: number;
  videoId: number;
  language: string;
  audioUrl: string;
  isAiGenerated: boolean;
  quality: 'standard' | 'high' | 'premium';
  voiceType?: string; // male, female, neutral
  createdAt: Date | string;
}

/**
 * Interface para ubicación del video
 */
export interface VideoLocation {
  latitude: number;
  longitude: number;
  name: string;
  city?: string;
  country?: string;
}

/**
 * Interface para música del video
 */
export interface VideoMusic {
  id: number;
  title: string;
  artist: string;
  duration: number;
  coverUrl?: string;
  audioUrl?: string;
}

/**
 * Interface para comentarios
 */
export interface VideoComment {
  id: number;
  videoId: number;
  userId: number;
  user: UserBasic;
  content: string;
  originalLanguage: string;
  translatedContent?: string;
  translatedTo?: string;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  parentCommentId?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

/**
 * DTO para crear un video
 */
export interface CreateVideoDto {
  videoFile?: File; // Para upload
  videoUrl?: string; // Para URL externa
  title?: string;
  description?: string;
  originalLanguage: string;
  isPublic?: boolean;
  tags?: string[];
  category?: string;
  locationId?: number;
  musicId?: number;
}

/**
 * DTO para actualizar un video
 */
export interface UpdateVideoDto {
  title?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  category?: string;
}

/**
 * Response para feed de videos
 */
export interface VideoFeedResponse {
  videos: Video[];
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
}

/**
 * Filtros para buscar videos
 */
export interface VideoFilters {
  userId?: number;
  category?: string;
  tags?: string[];
  language?: string;
  featured?: boolean;
  search?: string;
  sortBy?: 'recent' | 'popular' | 'trending';
  limit?: number;
  cursor?: string;
}

/**
 * Interface para estadísticas de video
 */
export interface VideoStats {
  videoId: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  watchTimeSeconds: number;
  averageWatchPercentage: number;
  engagementRate: number;
}

