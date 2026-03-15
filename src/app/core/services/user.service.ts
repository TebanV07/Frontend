import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  User,
  UserBasic,
  UpdateUserDto,
  UserSettingsDto,
  FollowListResponse
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  private usersCache$ = new BehaviorSubject<Map<number, User>>(new Map());

  // Mocks como fallback (puedes eliminar si quieres forzar backend)
  private mockUsers: User[] = [
    {
      id: 1,
      username: 'current_user',
      email: 'current@example.com',
      firstName: 'Usuario',
      lastName: 'Actual',
      nativeLanguage: 'es',
      name: 'Usuario Actual',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face',
      bio: '🚀 Full Stack Developer | Angular + FastAPI enthusiast',
      website: 'https://miportfolio.com',
      location: 'Cuenca, Ecuador',
      followers: 1250,
      following: 380,
      postsCount: 45,
      videosCount: 23,
      isActive: true,
      isVerified: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date(),
      lastLogin: new Date()
    },
    // ... conserva tus otros mockUsers (omito por brevedad)
  ];

  constructor(private http: HttpClient) {
    const cache = new Map<number, User>();
    this.mockUsers.forEach(u => cache.set(u.id, u));
    this.usersCache$.next(cache);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  // Mapea respuesta API a tu modelo User (maneja snake_case / camelCase)
  private mapApiToUser(api: any): User {
    if (!api) return {} as User;

    return {
      id: Number(api.id ?? api.user_id ?? 0),
      username: api.username ?? api.handle ?? '',
      email: api.email ?? api.mail ?? undefined,
      firstName: api.firstName ?? api.first_name ?? undefined,
      lastName: api.lastName ?? api.last_name ?? undefined,
      nativeLanguage: api.nativeLanguage ?? api.native_language ?? undefined,
      name: api.name ?? api.full_name ?? undefined,
      avatar: api.avatar ?? api.avatar_url ?? api.profile_picture_url ?? undefined,
      bio: api.bio ?? api.description ?? undefined,
      website: api.website ?? api.webpage ?? undefined,
      location: api.location ?? api.city ?? api.country ?? undefined,
      followers: Number(api.followers ?? api.followers_count ?? api.followersCount ?? 0),
      following: Number(api.following ?? api.following_count ?? api.followingCount ?? 0),
      postsCount: Number(api.postsCount ?? api.posts_count ?? api.posts ?? 0),
      videosCount: Number(api.videosCount ?? api.videos_count ?? api.videos ?? 0),
      isActive: api.isActive ?? api.is_active ?? undefined,
      isVerified: api.isVerified ?? api.is_verified ?? undefined,
      isOnline: api.isOnline ?? api.is_online ?? undefined,
      isFollowing: api.isFollowing ?? api.is_following ?? undefined,
      isBlocked: api.isBlocked ?? api.is_blocked ?? undefined,
      isMuted: api.isMuted ?? api.is_muted ?? undefined,
      createdAt: api.createdAt ?? api.created_at ?? undefined,
      updatedAt: api.updatedAt ?? api.updated_at ?? undefined,
      lastLogin: api.lastLogin ?? api.last_login ?? undefined
    } as User;
  }

  private toUserBasic(user: User): UserBasic {
    return {
      id: user.id,
      username: user.username,
      first_name: (user.firstName ?? '').toString(),
      last_name: (user.lastName ?? '').toString(),
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      location: user.location,
      followers_count: user.followers ?? 0,
      following_count: user.following ?? 0,
      posts_count: user.postsCount,
      videos_count: user.videosCount,
      is_active: user.isActive,
      is_verified: user.isVerified,
      last_activity: undefined,
      created_at: user.createdAt as any,
      updated_at: user.updatedAt as any,
      last_login: user.lastLogin as any
    };
  }

  // Obtener usuario por id
  getUserById(id: number): Observable<User | null> {
    const url = `${this.apiUrl}/users/${id}`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(apiRes => {
        const u = this.mapApiToUser(apiRes);
        const cache = new Map(this.usersCache$.getValue());
        cache.set(u.id, u);
        this.usersCache$.next(cache);
        return u;
      }),
      catchError(err => {
        console.warn(`GET ${url} falló, usando mock fallback`, err);
        const mock = this.mockUsers.find(u => u.id === id) ?? null;
        return of(mock);
      })
    );
  }

  // Obtener por username (ajusta endpoint si tu API lo expone distinto)
  getUserByUsername(username: string): Observable<User | null> {
    const url = `${this.apiUrl}/users/by-username`;
    const params = new HttpParams().set('username', username);
    return this.http.get<any>(url, { headers: this.getHeaders(), params }).pipe(
      map(apiRes => {
        const u = this.mapApiToUser(apiRes);
        const cache = new Map(this.usersCache$.getValue());
        cache.set(u.id, u);
        this.usersCache$.next(cache);
        return u;
      }),
      catchError(err => {
        console.warn(`GET ${url} falló, buscando mock by username`, err);
        const mock = this.mockUsers.find(u => u.username === username) ?? null;
        return of(mock);
      })
    );
  }

  searchUsers(query: string, limit = 10): Observable<UserBasic[]> {
    const url = `${this.apiUrl}/users/search`;
    const params = new HttpParams().set('q', query).set('limit', String(limit));
    return this.http.get<any>(url, { headers: this.getHeaders(), params }).pipe(
      map(res => {
        const list = Array.isArray(res?.users ?? res) ? (res.users ?? res) : [];
        return list.map((a: any) => this.toUserBasic(this.mapApiToUser(a)));
      }),
      catchError(err => {
        console.warn(`Search ${url} falló, usando mock`, err);
        const results = this.mockUsers
          .filter(u =>
            u.username.toLowerCase().includes(query.toLowerCase()) ||
            ((u.firstName ?? '').toLowerCase()).includes(query.toLowerCase()) ||
            ((u.lastName ?? '').toLowerCase()).includes(query.toLowerCase())
          )
          .slice(0, limit)
          .map(u => this.toUserBasic(u));
        return of(results);
      })
    );
  }

  updateUser(userId: number, data: UpdateUserDto): Observable<User | null> {
    const url = `${this.apiUrl}/users/${userId}`;
    return this.http.put<any>(url, data, { headers: this.getHeaders() }).pipe(
      map(apiRes => {
        const u = this.mapApiToUser(apiRes);
        const cache = new Map(this.usersCache$.getValue());
        cache.set(u.id, u);
        this.usersCache$.next(cache);
        return u;
      }),
      catchError(err => {
        console.error(`PUT ${url} falló`, err);
        const mock = this.mockUsers.find(u => u.id === userId) ?? null;
        if (mock) {
          Object.assign(mock, data, { updatedAt: new Date() } as any);
          const cache = new Map(this.usersCache$.getValue());
          cache.set(mock.id, mock);
          this.usersCache$.next(cache);
        }
        return of(mock);
      })
    );
  }

  updateSettings(userId: number, settings: UserSettingsDto): Observable<void> {
    const url = `${this.apiUrl}/users/${userId}/settings`;
    return this.http.put<void>(url, settings, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn(`PUT ${url} falló (settings), aplicando fallback mock`, err);
        return of(void 0);
      })
    );
  }

  followUser(userId: number): Observable<void> {
    const url = `${this.apiUrl}/users/${userId}/follow`;
    return this.http.post<any>(url, {}, { headers: this.getHeaders() }).pipe(
      tap(res => {
        const updatedUser = res?.user ? this.mapApiToUser(res.user) : null;
        const cache = new Map(this.usersCache$.getValue());
        const existing = cache.get(userId) ?? this.mockUsers.find(u => u.id === userId) ?? null;
        if (updatedUser) {
          cache.set(updatedUser.id, updatedUser);
        } else if (existing) {
          existing.isFollowing = true;
          existing.followers = Number((existing.followers ?? 0)) + 1;
          cache.set(existing.id, existing);
        }
        this.usersCache$.next(cache);
      }),
      catchError(err => {
        console.warn(`POST ${url} falló, aplicando mock follow`, err);
        const mock = this.mockUsers.find(u => u.id === userId);
        if (mock) {
          mock.isFollowing = true;
          mock.followers = (mock.followers ?? 0) + 1;
          const cache = new Map(this.usersCache$.getValue());
          cache.set(mock.id, mock);
          this.usersCache$.next(cache);
        }
        return of(void 0);
      })
    );
  }

  unfollowUser(userId: number): Observable<void> {
    const url = `${this.apiUrl}/users/${userId}/follow`;
    return this.http.delete<any>(url, { headers: this.getHeaders() }).pipe(
      tap(res => {
        const updatedUser = res?.user ? this.mapApiToUser(res.user) : null;
        const cache = new Map(this.usersCache$.getValue());
        const existing = cache.get(userId) ?? this.mockUsers.find(u => u.id === userId) ?? null;
        if (updatedUser) {
          cache.set(updatedUser.id, updatedUser);
        } else if (existing) {
          existing.isFollowing = false;
          existing.followers = Math.max(0, Number(existing.followers ?? 0) - 1);
          cache.set(existing.id, existing);
        }
        this.usersCache$.next(cache);
      }),
      catchError(err => {
        console.warn(`DELETE ${url} falló, aplicando mock unfollow`, err);
        const mock = this.mockUsers.find(u => u.id === userId);
        if (mock) {
          mock.isFollowing = false;
          mock.followers = Math.max(0, (mock.followers ?? 1) - 1);
          const cache = new Map(this.usersCache$.getValue());
          cache.set(mock.id, mock);
          this.usersCache$.next(cache);
        }
        return of(void 0);
      })
    );
  }

  getFollowers(userId: number, page = 1, pageSize = 20): Observable<FollowListResponse> {
    const url = `${this.apiUrl}/users/${userId}/followers`;
    const params = new HttpParams().set('page', String(page)).set('page_size', String(pageSize));
    return this.http.get<any>(url, { headers: this.getHeaders(), params }).pipe(
      map(res => {
        const users = Array.isArray(res?.users ?? res) ? (res.users ?? res) : [];
        return {
          users: users.map((a: any) => this.toUserBasic(this.mapApiToUser(a))),
          total: Number(res?.total ?? users.length),
          page: Number(res?.page ?? page),
          pageSize: Number(res?.page_size ?? res?.pageSize ?? pageSize),
          hasMore: Boolean(res?.has_more ?? res?.hasMore ?? (page * pageSize < (res?.total ?? 0)))
        } as FollowListResponse;
      }),
      catchError(err => {
        console.warn(`GET ${url} falló, usando mock followers`, err);
        const mockFollowers = this.mockUsers.slice(0, 5).map(u => this.toUserBasic(u));
        return of({
          users: mockFollowers,
          total: mockFollowers.length,
          page,
          pageSize,
          hasMore: false
        } as FollowListResponse);
      })
    );
  }

  getFollowing(userId: number, page = 1, pageSize = 20): Observable<FollowListResponse> {
    const url = `${this.apiUrl}/users/${userId}/following`;
    const params = new HttpParams().set('page', String(page)).set('page_size', String(pageSize));
    return this.http.get<any>(url, { headers: this.getHeaders(), params }).pipe(
      map(res => {
        const users = Array.isArray(res?.users ?? res) ? (res.users ?? res) : [];
        return {
          users: users.map((a: any) => this.toUserBasic(this.mapApiToUser(a))),
          total: Number(res?.total ?? users.length),
          page: Number(res?.page ?? page),
          pageSize: Number(res?.page_size ?? res?.pageSize ?? pageSize),
          hasMore: Boolean(res?.has_more ?? res?.hasMore ?? (page * pageSize < (res?.total ?? 0)))
        } as FollowListResponse;
      }),
      catchError(err => {
        console.warn(`GET ${url} falló, usando mock following`, err);
        const mockFollowing = this.mockUsers.slice(0, 3).map(u => this.toUserBasic(u));
        return of({
          users: mockFollowing,
          total: mockFollowing.length,
          page,
          pageSize,
          hasMore: false
        } as FollowListResponse);
      })
    );
  }

  getSuggestedUsers(limit = 5): Observable<UserBasic[]> {
    const url = `${this.apiUrl}/users/suggestions`;
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<any>(url, { headers: this.getHeaders(), params }).pipe(
      map(res => {
        const users = Array.isArray(res?.users ?? res) ? (res.users ?? res) : [];
        return users.map((a: any) => this.toUserBasic(this.mapApiToUser(a)));
      }),
      catchError(err => {
        console.warn(`GET ${url} falló, usando mock suggestions`, err);
        const suggested = this.mockUsers.filter(u => !u.isFollowing && u.id !== 1).slice(0, limit).map(u => this.toUserBasic(u));
        return of(suggested);
      })
    );
  }

  getAllMockUsers(): User[] {
    return [...this.mockUsers];
  }

  getUsersCache(): Observable<Map<number, User>> {
    return this.usersCache$.asObservable();
  }
}
