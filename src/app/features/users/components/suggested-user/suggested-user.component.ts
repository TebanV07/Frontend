import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FollowService, FollowUser } from '../../../../core/services/follow.service';

@Component({
  selector: 'app-suggested-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './suggested-user.component.html',
  styleUrl: './suggested-user.component.scss'
})
export class SuggestedUserComponent implements OnInit {
  suggestedUsers: FollowUser[] = [];
  isLoading: { [key: number]: boolean } = {};
  showAll = false;

  constructor(private followService: FollowService) {}

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.followService.getSuggestedUsers(10).subscribe({
      next: (users) => {
        this.suggestedUsers = users;
        console.log('✅ Sugerencias cargadas:', users);
      },
      error: (error) => {
        console.error('Error cargando sugerencias:', error);
      }
    });
  }

  toggleFollow(user: FollowUser) {
    this.isLoading[user.id] = true;

    if (user.isFollowing) {
      this.followService.unfollowUser(user.id).subscribe({
        next: () => {
          user.isFollowing = false;
          user.isPendingRequest = false;
          this.isLoading[user.id] = false;
          // Recargar sugerencias después de dejar de seguir
          setTimeout(() => this.loadSuggestions(), 300);
        },
        error: (error) => {
          console.error('Error al dejar de seguir:', error);
          this.isLoading[user.id] = false;
        }
      });
    } else {
      this.followService.followUser(user.id).subscribe({
        next: () => {
          user.isFollowing = true;
          this.isLoading[user.id] = false;
          // ⭐ MEJORADO: Eliminar usuario seguido de la lista y recargar sugerencias
          this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== user.id);
          // Cargar nuevas sugerencias para reemplazar el usuario seguido
          setTimeout(() => this.loadSuggestions(), 300);
        },
        error: (error) => {
          console.error('Error al seguir:', error);
          this.isLoading[user.id] = false;
        }
      });
    }
  }

  getButtonText(user: FollowUser): string {
    if (user.isFollowing) return 'Siguiendo';
    if (user.isPendingRequest) return 'Solicitado';
    return 'Seguir';
  }

  getDisplayedUsers(): FollowUser[] {
    return this.showAll ? this.suggestedUsers : this.suggestedUsers.slice(0, 5);
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }
}
