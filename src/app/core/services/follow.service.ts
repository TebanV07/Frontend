import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export interface FollowUser {
  id: number;
  username: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isPendingRequest?: boolean;
  mutualFollowersCount?: number;
  language?: string;
  email?: string;
  followers_count?: number;
  following_count?: number;
  is_verified?: boolean;
  country_code?: string;  // ⭐ NUEVO: País del usuario
  private_account?: boolean;
}

export interface ExploreCountryGroup {
  country_code: string;
  country_name: string;
  users_count: number;
  users: FollowUser[];
}

export interface ExplorePeopleResponse {
  countries: ExploreCountryGroup[];
  total_users: number;
}

export interface Follow {
  id: number;
  follower_id: number;
  following_id: number;
  created_at: string;
}

export interface FollowRequest {
  id: number;
  follower_id: number;
  following_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  follower?: FollowUser;
  following?: FollowUser;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following?: boolean;
  is_followed_by?: boolean;
}

interface FollowActionResponse {
  message?: string;
  is_following?: boolean;
  isFollowing?: boolean;
  is_pending_request?: boolean;
  isPendingRequest?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private apiUrl = 'http://localhost:8001/api/v1';

  private followingIdsSubject = new BehaviorSubject<number[]>([]);
  public followingIds$ = this.followingIdsSubject.asObservable();

  private followersSubject = new BehaviorSubject<FollowUser[]>([]);
  public followers$ = this.followersSubject.asObservable();

  private followingSubject = new BehaviorSubject<FollowUser[]>([]);
  public following$ = this.followingSubject.asObservable();

  private followRequestsSubject = new BehaviorSubject<FollowRequest[]>([]);
  public followRequests$ = this.followRequestsSubject.asObservable();

  private suggestedUsersSubject = new BehaviorSubject<FollowUser[]>([]);
  public suggestedUsers$ = this.suggestedUsersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ============== SEGUIR / DEJAR DE SEGUIR ==============

  /**
   * Seguir a un usuario
   * ✅ CORREGIDO: Usar /users/{user_id}/follow
   */
  followUser(userId: number): Observable<any> {
    return this.http.post<FollowActionResponse>(`${this.apiUrl}/users/${userId}/follow`, {})
      .pipe(
        tap((response) => {
          console.log('✅ Usuario seguido:', response);
          const isFollowing = Boolean(response?.is_following ?? response?.isFollowing ?? true);
          const isPending = Boolean(response?.is_pending_request ?? response?.isPendingRequest ?? false);

          if (isFollowing && !isPending) {
            const current = this.followingIdsSubject.value;
            if (!current.includes(userId)) {
              this.followingIdsSubject.next([...current, userId]);
            }
          }
        }),
        catchError(error => {
          console.error('❌ Error al seguir usuario:', error);

          // Manejo específico de errores
          if (error.status === 400) {
              if (error.error?.detail?.includes('Ya sigues')) {
              console.warn('⚠️ Ya sigues a este usuario');
              return of({ error: false, message: 'Ya sigues a este usuario' });
            }
          }

          return of({ error: true, message: error.error?.detail || 'Error al seguir' });
        })
      );
  }

  /**
   * Dejar de seguir a un usuario
   * ✅ CORREGIDO: Usar DELETE /users/{user_id}/follow
   */
  unfollowUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}/follow`)
      .pipe(
        tap(() => {
          console.log('✅ Dejaste de seguir al usuario');
          const current = this.followingIdsSubject.value;
          this.followingIdsSubject.next(current.filter(id => id !== userId));
        }),
        catchError(error => {
          console.error('❌ Error al dejar de seguir:', error);
          return of({ error: true, message: error.error?.detail || 'Error' });
        })
      );
  }

  // ============== OBTENER LISTAS ==============

  /**
   * Obtener seguidores de un usuario
   * ✅ CORREGIDO: Usar /users/{user_id}/followers
   */
  getFollowers(userId: number, skip: number = 0, limit: number = 20): Observable<FollowUser[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/users/${userId}/followers`, { params })
      .pipe(
        tap(response => {
          const followers = Array.isArray(response) ? response : (response.users || []);
          this.followersSubject.next(this.mapUsers(followers));
        }),
        catchError(error => {
          console.error('Error obteniendo seguidores:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener usuarios que sigue
   * ✅ CORREGIDO: Usar /users/{user_id}/following
   */
  getFollowing(userId: number, skip: number = 0, limit: number = 20): Observable<FollowUser[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/users/${userId}/following`, { params })
      .pipe(
        tap(response => {
          const following = Array.isArray(response) ? response : (response.users || []);
          this.followingSubject.next(this.mapUsers(following));
        }),
        catchError(error => {
          console.error('Error obteniendo following:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener estadísticas de follow de un usuario
   * ✅ Usar /follows/{user_id}/stats
   */
  getFollowStats(userId: number): Observable<FollowStats> {
    return this.http.get<FollowStats>(`${this.apiUrl}/follows/${userId}/stats`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo estadísticas:', error);
          return of({ followers_count: 0, following_count: 0 });
        })
      );
  }

  /**
   * Verificar estado de follow con un usuario
   * ✅ Usar /follows/{user_id}/status
   */
  getFollowStatus(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/follows/${userId}/status`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo estado de follow:', error);
          return of({ is_following: false, is_followed_by: false });
        })
      );
  }

  // ============== SOLICITUDES DE FOLLOW ==============

  /**
   * Obtener solicitudes de follow pendientes
   * ✅ Usar /follows/requests/pending
   */
  getFollowRequests(): Observable<FollowRequest[]> {
    return this.http.get<any>(`${this.apiUrl}/follows/requests/pending`)
      .pipe(
        map(response => {
          const requests = Array.isArray(response) ? response : (response.requests || []);
          return requests.map((request: any) => this.mapFollowRequest(request));
        }),
        tap((requests) => {
          this.followRequestsSubject.next(requests);
        }),
        catchError(error => {
          console.error('Error obteniendo solicitudes:', error);
          return of([]);
        })
      );
  }

  /**
   * Enviar solicitud de follow
   * ✅ Usar /follows/requests/{user_id}/send
   */
  sendFollowRequest(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/follows/requests/${userId}/send`, {})
      .pipe(
        catchError(error => {
          console.error('Error enviando solicitud:', error);
          return of(null);
        })
      );
  }

  /**
   * Aceptar solicitud de follow
   * ✅ Usar /follows/requests/{request_id}/accept
   */
  acceptFollowRequest(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/follows/requests/${requestId}/accept`, {})
      .pipe(
        tap(() => {
          const current = this.followRequestsSubject.value;
          this.followRequestsSubject.next(current.filter(r => r.id !== requestId));
        }),
        catchError(error => {
          console.error('Error aceptando solicitud:', error);
          return of(null);
        })
      );
  }

  /**
   * Rechazar solicitud de follow
   * ✅ Usar /follows/requests/{request_id}/reject
   */
  rejectFollowRequest(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/follows/requests/${requestId}/reject`, {})
      .pipe(
        tap(() => {
          const current = this.followRequestsSubject.value;
          this.followRequestsSubject.next(current.filter(r => r.id !== requestId));
        }),
        catchError(error => {
          console.error('Error rechazando solicitud:', error);
          return of(null);
        })
      );
  }

  // ============== SUGERENCIAS ==============

  /**
   * Obtener usuarios sugeridos para seguir
   * ✅ Usar /follows/suggestions/recommended
   */
  getSuggestedUsers(limit: number = 10): Observable<FollowUser[]> {
    let params = new HttpParams().set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/follows/suggestions/recommended`, { params })
      .pipe(
        tap(response => {
          const users = Array.isArray(response) ? response : (response.suggestions || response.users || []);
          this.suggestedUsersSubject.next(this.mapUsers(users));
        }),
        catchError(error => {
          console.error('Error obteniendo sugerencias:', error);
          return of([]);
        })
      );
  }

  /**
   * Buscar usuarios
   * ⭐ MEJORADO: Usa /users/search endpoint
   */
  searchUsers(query: string, limit: number = 20): Observable<FollowUser[]> {
    let params = new HttpParams()
      .set('q', query)
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/users/search`, { params })
      .pipe(
        tap(response => {
          const users = Array.isArray(response) ? response : (response.users || []);
          console.log('✅ Usuarios encontrados:', users);
        }),
        map(response => {
          const users = Array.isArray(response) ? response : (response.users || []);
          return this.mapUsers(users);
        }),
        catchError(error => {
          console.error('Error buscando usuarios:', error);
          return of([]);
        })
      );
  }

  getExploreCountries(): Observable<Array<{ country_code: string; country_name: string; users_count: number }>> {
    return this.http.get<any>(`${this.apiUrl}/users/explore/countries`).pipe(
      map((response) => {
        const countries = Array.isArray(response) ? response : (response?.countries || []);
        return countries.map((country: any) => ({
          country_code: String(country.country_code || 'OT').toUpperCase(),
          country_name: country.country_name || country.countryCode || 'Otros',
          users_count: Number(country.users_count || country.usersCount || 0),
        }));
      }),
      catchError((error) => {
        console.error('Error obteniendo países para explore:', error);
        return of([]);
      })
    );
  }

  getExplorePeople(countryCode?: string, limit: number = 80, perCountry: number = 12, query?: string): Observable<ExplorePeopleResponse> {
    let params = new HttpParams()
      .set('limit', String(limit))
      .set('per_country', String(perCountry));

    if (countryCode && countryCode !== 'ALL') {
      params = params.set('country_code', countryCode);
    }

    if (query?.trim()) {
      params = params.set('q', query.trim());
    }

    return this.http.get<any>(`${this.apiUrl}/users/explore/people`, { params }).pipe(
      map((response) => {
        const countries = Array.isArray(response?.countries) ? response.countries : [];

        return {
          countries: countries.map((group: any) => ({
            country_code: String(group.country_code || 'OT').toUpperCase(),
            country_name: group.country_name || 'Otros',
            users_count: Number(group.users_count || 0),
            users: this.mapUsers(group.users || []),
          })),
          total_users: Number(response?.total_users || 0),
        } as ExplorePeopleResponse;
      }),
      catchError((error) => {
        console.error('Error obteniendo personas para explore:', error);
        return of({ countries: [], total_users: 0 });
      })
    );
  }

  // ============== UTILIDADES ==============

  isFollowing(userId: number): boolean {
    return this.followingIdsSubject.value.includes(userId);
  }

  getPendingRequestsCount(): number {
    return this.followRequestsSubject.value.length;
  }

  updateFollowingIds(userIds: number[]): void {
    this.followingIdsSubject.next(userIds);
  }

  clearData(): void {
    this.followingIdsSubject.next([]);
    this.followersSubject.next([]);
    this.followingSubject.next([]);
    this.followRequestsSubject.next([]);
    this.suggestedUsersSubject.next([]);
  }

  /**
   * Mapear usuarios del backend al formato FollowUser
   */
  private mapUsers(users: any[]): FollowUser[] {
    return users.map(user => ({
      id: Number(user.id ?? user.user_id),
      username: user.username ?? user.handle ?? '',
      name: user.name ?? user.full_name ?? undefined,
      firstName: user.firstName ?? user.first_name ?? undefined,
      lastName: user.lastName ?? user.last_name ?? undefined,
      avatar: user.avatar ?? user.avatar_url ?? user.profile_picture_url ?? undefined,
      bio: user.bio ?? user.description ?? undefined,
      isFollowing: Boolean(user.isFollowing ?? user.is_following ?? false),
      isFollowedBy: Boolean(user.isFollowedBy ?? user.is_followed_by ?? false),
      isPendingRequest: Boolean(user.isPendingRequest ?? user.is_pending_request ?? user.has_pending_request ?? false),
      mutualFollowersCount: Number(user.mutualFollowersCount ?? user.mutual_followers_count ?? 0),
      language: user.language ?? user.native_language ?? undefined,
      email: user.email ?? undefined,
      followers_count: Number(user.followers_count ?? user.followers ?? 0),
      following_count: Number(user.following_count ?? user.following ?? 0),
      is_verified: Boolean(user.is_verified ?? user.isVerified ?? false),
      country_code: user.country_code ?? user.countryCode ?? undefined,  // ⭐ NUEVO: Mapear país
      private_account: Boolean(user.private_account ?? user.privateAccount ?? false),
    }));
  }

  private mapFollowRequest(request: any): FollowRequest {
    const followerRaw = request?.follower || {
      id: request?.requester_id,
      username: request?.username,
      first_name: request?.first_name,
      last_name: request?.last_name,
      avatar: request?.avatar,
      bio: request?.bio,
      followers_count: request?.followers_count,
    };

    return {
      id: Number(request?.id ?? request?.request_id ?? 0),
      follower_id: Number(request?.follower_id ?? request?.requester_id ?? followerRaw?.id ?? 0),
      following_id: Number(request?.following_id ?? request?.receiver_id ?? 0),
      status: request?.status ?? 'pending',
      created_at: request?.created_at ?? request?.createdAt ?? new Date().toISOString(),
      follower: followerRaw ? this.mapUsers([followerRaw])[0] : undefined,
    };
  }

  loadInitialData(userId: number): void {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('⚠️ loadInitialData - No hay token, no se cargan datos');
      return;
    }
    this.getFollowing(userId).subscribe();
    this.getFollowRequests().subscribe();
    this.getSuggestedUsers().subscribe();
  }
}
