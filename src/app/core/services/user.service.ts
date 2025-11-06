import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, delay, BehaviorSubject } from 'rxjs';
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
  private apiUrl = 'http://localhost:8001/api/v1';
  
  // BehaviorSubjects para datos reactivos
  private usersCache$ = new BehaviorSubject<Map<number, User>>(new Map());

  // Mock data - usuarios de ejemplo
  private mockUsers: User[] = [
    {
      id: 1,
      username: 'current_user',
      email: 'current@example.com',
      firstName: 'Usuario',
      lastName: 'Actual',
      nativeLanguage: 'es',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face',
      bio: '🚀 Full Stack Developer | Angular + FastAPI enthusiast',
      website: 'https://miportfolio.com',
      location: 'Cuenca, Ecuador',
      followersCount: 1250,
      followingCount: 380,
      postsCount: 45,
      videosCount: 23,
      isActive: true,
      isVerified: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date(),
      lastLogin: new Date()
    },
    {
      id: 2,
      username: 'maria_gonzalez',
      email: 'maria@example.com',
      firstName: 'María',
      lastName: 'González',
      nativeLanguage: 'es',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b05b?w=400&h=400&fit=crop&crop=face',
      bio: '📸 Content Creator | Travel & Tech | 🌎 Exploring the world one video at a time',
      website: 'https://mariaglez.com',
      location: 'Madrid, España',
      followersCount: 45800,
      followingCount: 623,
      postsCount: 234,
      videosCount: 189,
      isActive: true,
      isVerified: true,
      isFollowing: true,
      createdAt: new Date('2022-03-20'),
      updatedAt: new Date(),
    },
    {
      id: 3,
      username: 'hiroshi_tanaka',
      email: 'hiroshi@example.com',
      firstName: 'Hiroshi',
      lastName: 'Tanaka',
      nativeLanguage: 'ja',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: '🎮 Game Developer | AI Enthusiast | Tokyo 🗾',
      location: 'Tokyo, Japan',
      followersCount: 12400,
      followingCount: 189,
      postsCount: 156,
      videosCount: 87,
      isActive: true,
      isVerified: true,
      isFollowing: false,
      createdAt: new Date('2022-06-10'),
      updatedAt: new Date(),
    },
    {
      id: 4,
      username: 'sophie_laurent',
      email: 'sophie@example.com',
      firstName: 'Sophie',
      lastName: 'Laurent',
      nativeLanguage: 'fr',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      bio: '🎨 Digital Artist | UI/UX Designer | Paris ✨',
      website: 'https://sophielaurent.design',
      location: 'Paris, France',
      followersCount: 23600,
      followingCount: 445,
      postsCount: 312,
      videosCount: 145,
      isActive: true,
      isVerified: true,
      isFollowing: true,
      createdAt: new Date('2021-11-05'),
      updatedAt: new Date(),
    },
    {
      id: 5,
      username: 'carlos_silva',
      email: 'carlos@example.com',
      firstName: 'Carlos',
      lastName: 'Silva',
      nativeLanguage: 'pt',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      bio: '⚽ Football Coach | Sports Science | Rio de Janeiro 🇧🇷',
      location: 'Rio de Janeiro, Brazil',
      followersCount: 8900,
      followingCount: 234,
      postsCount: 89,
      videosCount: 134,
      isActive: true,
      isVerified: false,
      isFollowing: false,
      createdAt: new Date('2023-02-14'),
      updatedAt: new Date(),
    },
    {
      id: 6,
      username: 'emma_wilson',
      email: 'emma@example.com',
      firstName: 'Emma',
      lastName: 'Wilson',
      nativeLanguage: 'en',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
      bio: '🎬 Film Director | Storyteller | London 🎥',
      website: 'https://emmawilson.films',
      location: 'London, UK',
      followersCount: 67200,
      followingCount: 891,
      postsCount: 445,
      videosCount: 298,
      isActive: true,
      isVerified: true,
      isFollowing: true,
      createdAt: new Date('2021-08-22'),
      updatedAt: new Date(),
    }
  ];

  constructor(private http: HttpClient) {
    // Inicializar cache con mock data
    const cache = new Map<number, User>();
    this.mockUsers.forEach(user => cache.set(user.id, user));
    this.usersCache$.next(cache);
  }

  /**
   * Obtiene un usuario por ID
   * Intenta desde backend, fallback a mock
   */
  getUserById(id: number): Observable<User> {
    // Primero intenta desde backend
    // return this.http.get<User>(`${this.apiUrl}/users/${id}`).pipe(
    //   catchError(() => {
    //     // Fallback a mock data
    //     const mockUser = this.mockUsers.find(u => u.id === id);
    //     return mockUser ? of(mockUser) : throwError(() => new Error('User not found'));
    //   })
    // );

    // Por ahora solo mock (descomenta arriba cuando tengas backend listo)
    const user = this.mockUsers.find(u => u.id === id);
    return of(user!).pipe(delay(300));
  }

  /**
   * Obtiene un usuario por username
   */
  getUserByUsername(username: string): Observable<User> {
    const user = this.mockUsers.find(u => u.username === username);
    return of(user!).pipe(delay(300));
  }

  /**
   * Busca usuarios por término
   */
  searchUsers(query: string, limit: number = 10): Observable<UserBasic[]> {
    const results = this.mockUsers
      .filter(u => 
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.firstName.toLowerCase().includes(query.toLowerCase()) ||
        u.lastName.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
      .map(u => this.toUserBasic(u));
    
    return of(results).pipe(delay(200));
  }

  /**
   * Actualiza perfil del usuario
   */
  updateUser(userId: number, data: UpdateUserDto): Observable<User> {
    // return this.http.put<User>(`${this.apiUrl}/users/${userId}`, data);
    
    // Mock: actualizar en memoria
    const user = this.mockUsers.find(u => u.id === userId);
    if (user) {
      Object.assign(user, data, { updatedAt: new Date() });
    }
    return of(user!).pipe(delay(500));
  }

  /**
   * Actualiza configuraciones del usuario
   */
  updateSettings(userId: number, settings: UserSettingsDto): Observable<void> {
    // return this.http.put<void>(`${this.apiUrl}/users/${userId}/settings`, settings);
    return of(void 0).pipe(delay(300));
  }

  /**
   * Sigue a un usuario
   */
  followUser(userId: number): Observable<void> {
    // return this.http.post<void>(`${this.apiUrl}/users/${userId}/follow`, {});
    
    // Mock: actualizar estado
    const user = this.mockUsers.find(u => u.id === userId);
    if (user) {
      user.isFollowing = true;
      user.followersCount++;
    }
    return of(void 0).pipe(delay(300));
  }

  /**
   * Deja de seguir a un usuario
   */
  unfollowUser(userId: number): Observable<void> {
    // return this.http.delete<void>(`${this.apiUrl}/users/${userId}/follow`);
    
    // Mock: actualizar estado
    const user = this.mockUsers.find(u => u.id === userId);
    if (user) {
      user.isFollowing = false;
      user.followersCount--;
    }
    return of(void 0).pipe(delay(300));
  }

  /**
   * Obtiene lista de seguidores
   */
  getFollowers(userId: number, page: number = 1, pageSize: number = 20): Observable<FollowListResponse> {
    // Mock: simular paginación
    const mockFollowers = this.mockUsers.slice(0, 5).map(u => this.toUserBasic(u));
    
    return of({
      users: mockFollowers,
      total: 15,
      page,
      pageSize,
      hasMore: page * pageSize < 15
    }).pipe(delay(300));
  }

  /**
   * Obtiene lista de seguidos
   */
  getFollowing(userId: number, page: number = 1, pageSize: number = 20): Observable<FollowListResponse> {
    const mockFollowing = this.mockUsers.slice(0, 3).map(u => this.toUserBasic(u));
    
    return of({
      users: mockFollowing,
      total: 8,
      page,
      pageSize,
      hasMore: page * pageSize < 8
    }).pipe(delay(300));
  }

  /**
   * Obtiene usuarios sugeridos para seguir
   */
  getSuggestedUsers(limit: number = 5): Observable<UserBasic[]> {
    const suggested = this.mockUsers
      .filter(u => !u.isFollowing && u.id !== 1)
      .slice(0, limit)
      .map(u => this.toUserBasic(u));
    
    return of(suggested).pipe(delay(300));
  }

  /**
   * Convierte User a UserBasic
   */
  private toUserBasic(user: User): UserBasic {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isFollowing: user.isFollowing
    };
  }

  /**
   * Obtiene todos los usuarios mock (para desarrollo)
   */
  getAllMockUsers(): User[] {
    return [...this.mockUsers];
  }
}