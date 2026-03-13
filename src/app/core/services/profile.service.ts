import { Injectable, Inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User, UpdateUserDto } from '../models/user.model';
import { Video } from '../models/video.model';

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  posts: any;
  totalViews: number;
  totalLikes: number;
  totalVideos: number;
  joinedDate?: Date;
  website?: string;
  videos: Video[];
  followers: number;
  following: number;
  isFollowing?: boolean;
  country?: string;
}

export interface PostsPage {
  posts: any[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface VideosPage {
  videos: any[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'https://web-production-94f95.up.railway.app/api/v1';
  private currentProfile$ = new BehaviorSubject<UserProfile | null>(null);
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      afterNextRender(() => {
        console.log('🟢 afterNextRender ejecutado - cargando perfil');
        this.loadCurrentProfile();
      });
    }
  }

  getCurrentProfile(): Observable<UserProfile | null> {
    return this.currentProfile$.asObservable();
  }

  getProfileById(userId: number): Observable<UserProfile | null> {
    const url = `${this.apiUrl}/profiles/${userId}`;
    return this.http.get<any>(url).pipe(
      map(resp => this.apiToUserProfile(resp)),
      catchError(err => {
        console.error(`Error fetching profile ${userId}`, err);
        return of(null);
      })
    );
  }

  getProfileByUsername(username: string): Observable<UserProfile | null> {
    const url = `${this.apiUrl}/users/username/${username}`;
    return this.http.get<any>(url).pipe(
      map(resp => this.apiToUserProfile(resp)),
      catchError(err => {
        console.error(`Error fetching profile ${username}`, err);
        return of(null);
      })
    );
  }

  // ==================== POSTS Y VIDEOS DEL PERFIL ====================

  getUserPosts(userId: number, page: number = 1, pageSize: number = 12): Observable<PostsPage> {
    const url = `${this.apiUrl}/users/${userId}/posts?page=${page}&page_size=${pageSize}`;
    return this.http.get<PostsPage>(url).pipe(
      catchError(err => {
        console.error(`Error fetching posts for user ${userId}`, err);
        return of({ posts: [], total: 0, page: 1, page_size: pageSize, has_more: false });
      })
    );
  }

  getUserVideos(userId: number, page: number = 1, pageSize: number = 12): Observable<VideosPage> {
    const url = `${this.apiUrl}/users/${userId}/videos?page=${page}&page_size=${pageSize}`;
    return this.http.get<VideosPage>(url).pipe(
      catchError(err => {
        console.error(`Error fetching videos for user ${userId}`, err);
        return of({ videos: [], total: 0, page: 1, page_size: pageSize, has_more: false });
      })
    );
  }

  // ==================== FOLLOW ====================

  toggleFollow(userId: number): Observable<boolean> {
    const current = this.currentProfile$.getValue();
    let prevState: { isFollowing?: boolean; followers?: number } | null = null;
    if (current && Number(current.id) === Number(userId)) {
      prevState = { isFollowing: current.isFollowing, followers: current.followers };
      const optimistic: UserProfile = {
        ...current,
        isFollowing: !current.isFollowing,
        followers: current.isFollowing ? current.followers - 1 : current.followers + 1
      };
      this.currentProfile$.next(optimistic);
    }

    const url = `${this.apiUrl}/users/${userId}/follow`;
    const isCurrentlyFollowing = prevState?.isFollowing ?? current?.isFollowing ?? false;

    const request = isCurrentlyFollowing
      ? this.http.delete<any>(url)
      : this.http.post<any>(url, {});

    return request.pipe(
      map(res => {
        const isFollowing = Boolean(res?.is_following ?? res?.isFollowing ?? !isCurrentlyFollowing);
        const followers = Number(res?.followers_count ?? res?.followers ?? undefined);
        const cp = this.currentProfile$.getValue();
        if (cp && Number(cp.id) === Number(userId)) {
          this.currentProfile$.next({ ...cp, isFollowing, followers: Number(followers ?? cp.followers) });
        }
        return isFollowing;
      }),
      catchError(err => {
        console.error('Error toggling follow', err);
        const cp = this.currentProfile$.getValue();
        if (cp && prevState && Number(cp.id) === Number(userId)) {
          this.currentProfile$.next({ ...cp, isFollowing: prevState.isFollowing, followers: prevState.followers ?? cp.followers });
        }
        return of(prevState?.isFollowing ?? false);
      })
    );
  }

  updateProfile(profile: UserProfile): Observable<UserProfile | null> {
    const url = `${this.apiUrl}/users/${profile.id}`;
    const body: UpdateUserDto = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      name: profile.name,
      bio: profile.bio,
      website: profile.website,
      location: profile.location,
      nativeLanguage: profile.nativeLanguage,
      avatar: profile.avatar
    };

    return this.http.put<any>(url, body).pipe(
      map(resp => this.apiToUserProfile(resp)),
      tap(updated => { if (updated) this.currentProfile$.next(updated); }),
      catchError(err => {
        console.error(`Error updating profile ${profile.id}`, err);
        return of(null);
      })
    );
  }

  private loadCurrentProfile(): void {
    console.log('🟦 loadCurrentProfile INICIADO');
    const url = `${this.apiUrl}/users/me`;
    const token = localStorage.getItem('access_token');
    const options = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

    this.http.get<any>(url, options).pipe(
      map(resp => this.apiToUserProfile(resp)),
      catchError(err => {
        console.error('❌ ERROR:', err);
        return of(null);
      })
    ).subscribe(p => {
      console.log('✅ Perfil cargado:', p);
      this.currentProfile$.next(p);
    });
  }

  private apiToUserProfile(data: any): UserProfile | null {
    if (!data) return null;

    const userBase: User = {
      id: Number(data.id ?? data.user_id ?? 0),
      username: data.username ?? data.handle ?? '',
      email: data.email ?? undefined,
      firstName: data.firstName ?? data.first_name ?? undefined,
      lastName: data.lastName ?? data.last_name ?? undefined,
      nativeLanguage: data.nativeLanguage ?? data.native_language ?? undefined,
      name: data.name ?? data.full_name ?? undefined,
      avatar: data.avatar ?? data.avatar_url ?? undefined,
      bio: data.bio ?? data.description ?? undefined,
      website: data.website ?? data.webpage ?? undefined,
      location: data.location ?? undefined,
      followers: Number(data.followers ?? data.followers_count ?? data.followersCount ?? 0),
      following: Number(data.following ?? data.following_count ?? data.followingCount ?? 0),
      postsCount: Number(data.postsCount ?? data.posts_count ?? 0),
      videosCount: Number(data.videosCount ?? data.videos_count ?? 0),
      isActive: data.isActive ?? data.is_active ?? undefined,
      isVerified: data.isVerified ?? data.is_verified ?? undefined,
      isOnline: data.isOnline ?? data.is_online ?? undefined,
      isFollowing: Boolean(data.isFollowing ?? data.is_following ?? false),
      createdAt: data.createdAt ?? data.created_at ?? undefined,
      updatedAt: data.updatedAt ?? data.updated_at ?? undefined,
      lastLogin: data.lastLogin ?? data.last_login ?? undefined
    };

    const apiVideos: any[] = Array.isArray(data.videos) ? data.videos : [];
    const videos: Video[] = apiVideos.map(v => ({
      id: Number(v.id ?? 0),
      uuid: v.uuid ?? '',
      videoUrl: v.video_url ?? v.videoUrl ?? '',
      thumbnailUrl: v.thumbnail_url ?? v.thumbnailUrl ?? '',
      title: v.title ?? '',
      description: v.description ?? '',
      duration: Number(v.duration ?? 0),
      width: Number(v.width ?? 0),
      height: Number(v.height ?? 0),
      aspectRatio: v.aspect_ratio ?? v.aspectRatio ?? '',
      fileSize: Number(v.file_size ?? v.fileSize ?? 0),
      format: v.format ?? undefined,
      userId: Number(v.user_id ?? v.userId ?? data.id ?? 0),
      user: v.user ?? ({} as any),
      originalLanguage: v.original_language ?? v.originalLanguage ?? '',
      availableLanguages: v.available_languages ?? v.availableLanguages ?? [],
      hasSubtitles: Boolean(v.has_subtitles ?? false),
      hasAudioTranslation: Boolean(v.has_audio_translation ?? false),
      likesCount: Number(v.likes_count ?? v.likesCount ?? 0),
      commentsCount: Number(v.comments_count ?? v.commentsCount ?? 0),
      sharesCount: Number(v.shares_count ?? v.sharesCount ?? 0),
      viewsCount: Number(v.views_count ?? v.viewsCount ?? 0),
      savesCount: Number(v.saves_count ?? v.savesCount ?? 0),
      isLiked: Boolean(v.is_liked ?? false),
      isSaved: Boolean(v.is_saved ?? false),
      hasCommented: Boolean(v.has_commented ?? false),
      isPublic: Boolean(v.is_public ?? true),
      isActive: Boolean(v.is_active ?? true),
      isFeatured: Boolean(v.is_featured ?? false),
      tags: v.tags ?? [],
      category: v.category ?? undefined,
      location: v.location ?? undefined,
      music: v.music ?? undefined,
      createdAt: v.created_at ?? v.createdAt ?? undefined,
      updatedAt: v.updated_at ?? v.updatedAt ?? undefined,
      publishedAt: v.published_at ?? v.publishedAt ?? undefined
    } as Video));

    return {
      ...userBase,
      totalViews: Number(data.total_views ?? data.totalViews ?? 0),
      totalLikes: Number(data.total_likes ?? data.totalLikes ?? 0),
      totalVideos: Number(data.total_videos ?? data.totalVideos ?? videos.length),
      joinedDate: data.joined_date ? new Date(data.joined_date) : (data.joinedDate ? new Date(data.joinedDate) : undefined),
      website: data.website ?? data.webpage ?? userBase.website,
      videos,
      followers: Number(data.followers ?? data.followers_count ?? userBase.followers ?? 0),
      following: Number(data.following ?? data.following_count ?? userBase.following ?? 0),
      isFollowing: Boolean(data.is_following ?? data.isFollowing ?? false),
      posts: undefined,
      followersCount: 0,
      followingCount: 0
    };
  }
}

