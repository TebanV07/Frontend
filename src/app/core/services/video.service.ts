import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  verified: boolean;
  followers: number;
  following: number;
  bio?: string;
  language: string;
  country: string;
}

export interface Video {
  id: string;
  user: User;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  originalLanguage: string;
  translatedTitle?: string;
  translatedDescription?: string;
  hasAudioTranslation: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: Date;
  category: string;
  tags: string[];
}

export interface Live {
  id: string;
  user: User;
  title: string;
  description: string;
  streamUrl: string;
  thumbnailUrl: string;
  viewers: number;
  likes: number;
  duration: number;
  isLive: boolean;
  startedAt: Date;
  originalLanguage: string;
  hasLiveTranslation: boolean;
  category: string;
}

export interface Trending {
  id: string;
  title: string;
  videosCount: number;
  views: number;
  thumbnailUrl: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private currentVideo$ = new BehaviorSubject<Video | null>(null);

  private mockUsers: User[] = [
    {
      id: '1',
      username: '@techmaster',
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      verified: true,
      followers: 125000,
      following: 342,
      bio: 'Tech enthusiast & AI developer 🤖 | Sharing knowledge daily',
      language: 'English',
      country: 'USA'
    },
    {
      id: '2',
      username: '@mariachef',
      name: 'María Rodríguez',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b05b?w=150&h=150&fit=crop',
      verified: true,
      followers: 89000,
      following: 156,
      bio: 'Chef profesional 👩‍🍳 | Recetas internacionales',
      language: 'Spanish',
      country: 'Spain'
    },
    {
      id: '3',
      username: '@yuki_travels',
      name: 'Yuki Tanaka',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      verified: false,
      followers: 45000,
      following: 289,
      bio: '旅行者 ✈️ | Exploring the world',
      language: 'Japanese',
      country: 'Japan'
    },
    {
      id: '4',
      username: '@fitness_pro',
      name: 'Marcus Johnson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      verified: true,
      followers: 210000,
      following: 98,
      bio: 'Fitness coach 💪 | Transform your life',
      language: 'English',
      country: 'UK'
    }
  ];

  private mockVideos: Video[] = [
    {
      id: '1',
      user: this.mockUsers[0],
      title: 'AI Translation in Real-Time: The Future is Here!',
      description: 'Exploring how AI is breaking language barriers in real-time communication. Amazing technology! 🚀',
      videoUrl: 'https://example.com/video1.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=700&fit=crop',
      duration: 45,
      views: 234000,
      likes: 12500,
      comments: 856,
      shares: 1200,
      originalLanguage: 'English',
      translatedTitle: 'Traducción con IA en Tiempo Real: ¡El Futuro está Aquí!',
      translatedDescription: 'Explorando cómo la IA está rompiendo las barreras del idioma en la comunicación en tiempo real. ¡Tecnología increíble! 🚀',
      hasAudioTranslation: true,
      isLiked: false,
      isBookmarked: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      category: 'Technology',
      tags: ['AI', 'Translation', 'Tech']
    },
    {
      id: '2',
      user: this.mockUsers[1],
      title: 'Paella Española Auténtica - Receta Tradicional',
      description: 'Aprende a hacer la mejor paella española con ingredientes frescos y técnicas tradicionales 🥘',
      videoUrl: 'https://example.com/video2.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=700&fit=crop',
      duration: 58,
      views: 156000,
      likes: 9800,
      comments: 432,
      shares: 890,
      originalLanguage: 'Spanish',
      translatedTitle: 'Authentic Spanish Paella - Traditional Recipe',
      translatedDescription: 'Learn to make the best Spanish paella with fresh ingredients and traditional techniques 🥘',
      hasAudioTranslation: true,
      isLiked: true,
      isBookmarked: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      category: 'Food',
      tags: ['Cooking', 'Spanish', 'Recipe']
    },
    {
      id: '3',
      user: this.mockUsers[2],
      title: '東京の隠れた名所 | Hidden Gems in Tokyo',
      description: '観光客があまり知らない東京の素晴らしい場所を紹介します 🗼',
      videoUrl: 'https://example.com/video3.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=700&fit=crop',
      duration: 62,
      views: 89000,
      likes: 5600,
      comments: 324,
      shares: 456,
      originalLanguage: 'Japanese',
      translatedTitle: 'Hidden Gems in Tokyo | Secret Spots',
      translatedDescription: 'Discover amazing places in Tokyo that tourists rarely know about 🗼',
      hasAudioTranslation: true,
      isLiked: false,
      isBookmarked: true,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      category: 'Travel',
      tags: ['Tokyo', 'Travel', 'Japan']
    },
    {
      id: '4',
      user: this.mockUsers[3],
      title: '10-Minute Full Body Workout - No Equipment Needed',
      description: 'Get fit at home with this intense 10-minute workout routine! Perfect for busy people 💪🔥',
      videoUrl: 'https://example.com/video4.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=700&fit=crop',
      duration: 10,
      views: 445000,
      likes: 28000,
      comments: 1234,
      shares: 3400,
      originalLanguage: 'English',
      translatedTitle: 'Entrenamiento Completo de 10 Minutos - Sin Equipo',
      translatedDescription: '¡Ponte en forma en casa con esta intensa rutina de 10 minutos! Perfecto para personas ocupadas 💪🔥',
      hasAudioTranslation: true,
      isLiked: true,
      isBookmarked: true,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      category: 'Fitness',
      tags: ['Workout', 'Fitness', 'Health']
    }
  ];

  private mockLiveStreams: Live[] = [
    {
      id: 'live1',
      user: this.mockUsers[0],
      title: 'Building AI Apps LIVE - Q&A Session',
      description: 'Join me as I code and answer your questions about AI development!',
      streamUrl: 'https://example.com/live1',
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
      viewers: 3420,
      likes: 1250,
      duration: 45,
      isLive: true,
      startedAt: new Date(Date.now() - 45 * 60 * 1000),
      originalLanguage: 'English',
      hasLiveTranslation: true,
      category: 'Technology'
    },
    {
      id: 'live2',
      user: this.mockUsers[1],
      title: 'Cocinando en VIVO - Tapas Españolas',
      description: '¡Únete para aprender a hacer deliciosas tapas! Traducción en tiempo real disponible 🍴',
      streamUrl: 'https://example.com/live2',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=225&fit=crop',
      viewers: 2180,
      likes: 890,
      duration: 32,
      isLive: true,
      startedAt: new Date(Date.now() - 32 * 60 * 1000),
      originalLanguage: 'Spanish',
      hasLiveTranslation: true,
      category: 'Food'
    },
    {
      id: 'live3',
      user: this.mockUsers[3],
      title: 'Morning Workout Session - Join Me!',
      description: 'Start your day right with an energizing workout! All levels welcome 🌅💪',
      streamUrl: 'https://example.com/live3',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=225&fit=crop',
      viewers: 5240,
      likes: 2100,
      duration: 28,
      isLive: true,
      startedAt: new Date(Date.now() - 28 * 60 * 1000),
      originalLanguage: 'English',
      hasLiveTranslation: true,
      category: 'Fitness'
    }
  ];

  private mockTrending: Trending[] = [
    {
      id: 't1',
      title: '#AITranslation',
      videosCount: 12500,
      views: 45000000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop',
      category: 'Technology'
    },
    {
      id: 't2',
      title: '#WorldCuisine',
      videosCount: 8900,
      views: 32000000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
      category: 'Food'
    },
    {
      id: 't3',
      title: '#FitnessChallenge',
      videosCount: 15600,
      views: 67000000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop',
      category: 'Fitness'
    },
    {
      id: 't4',
      title: '#TravelVlog',
      videosCount: 9800,
      views: 28000000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&h=200&fit=crop',
      category: 'Travel'
    }
  ];

  getVideos(): Observable<Video[]> {
    return of(this.mockVideos);
  }

  getLiveStreams(): Observable<Live[]> {
    return of(this.mockLiveStreams);
  }

  getTrending(): Observable<Trending[]> {
    return of(this.mockTrending);
  }

  getCurrentVideo(): Observable<Video | null> {
    return this.currentVideo$.asObservable();
  }

  setCurrentVideo(video: Video) {
    this.currentVideo$.next(video);
  }

  toggleLike(videoId: string): Observable<boolean> {
    const video = this.mockVideos.find(v => v.id === videoId);
    if (video) {
      video.isLiked = !video.isLiked;
      video.likes += video.isLiked ? 1 : -1;
    }
    return of(video?.isLiked || false);
  }

  toggleBookmark(videoId: string): Observable<boolean> {
    const video = this.mockVideos.find(v => v.id === videoId);
    if (video) {
      video.isBookmarked = !video.isBookmarked;
    }
    return of(video?.isBookmarked || false);
  }
}