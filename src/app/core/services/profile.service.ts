import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { User, Video } from './video.service';

export interface UserProfile extends User {
  totalViews: number;
  totalLikes: number;
  totalVideos: number;
  joinedDate: Date;
  website?: string;
  videos: Video[];
  followers: number;
  following: number;
  isFollowing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private currentProfile$ = new BehaviorSubject<UserProfile | null>(null);

  private mockProfile: UserProfile = {
    id: '1',
    username: '@techmaster',
    name: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    verified: true,
    followers: 125000,
    following: 342,
    bio: 'Tech enthusiast & AI developer 🤖 | Sharing knowledge daily',
    language: 'English',
    country: 'USA',
    totalViews: 2540000,
    totalLikes: 185600,
    totalVideos: 48,
    joinedDate: new Date('2021-03-15'),
    website: 'https://alexchen.dev',
    isFollowing: false,
    videos: [
      {
        id: '1',
        user: {
          id: '1',
          username: '@techmaster',
          name: 'Alex Chen',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
          verified: true,
          followers: 125000,
          following: 342,
          bio: 'Tech enthusiast & AI developer 🤖',
          language: 'English',
          country: 'USA'
        },
        title: 'AI Translation in Real-Time: The Future is Here!',
        description: 'Exploring how AI is breaking language barriers',
        videoUrl: 'https://example.com/video1.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=700&fit=crop',
        duration: 45,
        views: 234000,
        likes: 12500,
        comments: 856,
        shares: 1200,
        originalLanguage: 'English',
        hasAudioTranslation: true,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        category: 'Technology',
        tags: ['AI', 'Translation', 'Tech']
      },
      {
        id: '2',
        user: {
          id: '1',
          username: '@techmaster',
          name: 'Alex Chen',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
          verified: true,
          followers: 125000,
          following: 342,
          bio: 'Tech enthusiast & AI developer 🤖',
          language: 'English',
          country: 'USA'
        },
        title: 'Building Web Apps with Angular',
        description: 'Advanced tips and tricks for Angular development',
        videoUrl: 'https://example.com/video2.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=700&fit=crop',
        duration: 52,
        views: 189000,
        likes: 9800,
        comments: 654,
        shares: 890,
        originalLanguage: 'English',
        hasAudioTranslation: true,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        category: 'Technology',
        tags: ['Angular', 'Web', 'Programming']
      }
    ]
  };

  constructor() {
    this.currentProfile$.next(this.mockProfile);
  }

  getCurrentProfile(): Observable<UserProfile | null> {
    return this.currentProfile$.asObservable();
  }

  getProfileById(userId: string): Observable<UserProfile> {
    return of(this.mockProfile);
  }

  toggleFollow(userId: string): Observable<boolean> {
    const profile = this.mockProfile;
    profile.isFollowing = !profile.isFollowing;
    if (profile.isFollowing) {
      profile.followers++;
    } else {
      profile.followers--;
    }
    this.currentProfile$.next(profile);
    return of(profile.isFollowing || false);
  }

  updateProfile(profile: UserProfile): Observable<UserProfile> {
    this.mockProfile = profile;
    this.currentProfile$.next(profile);
    return of(profile);
  }
}