import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { FollowService, FollowUser } from '../../../../core/services/follow.service';

@Component({
  selector: 'app-suggested-users',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './suggested-user.component.html',
  styleUrl: './suggested-user.component.scss'
})
export class SuggestedUserComponent implements OnInit {
  suggestedUsers: FollowUser[] = [];
  isLoading: { [key: number]: boolean } = {};
  showAll = false;
  dismissedUserIds: Set<number> = new Set();

  constructor(private followService: FollowService) {}

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.followService.getSuggestedUsers(10).subscribe({
      next: (users) => {
        // Filtrar usuarios ya descartados al recargar
        this.suggestedUsers = users.filter(u => !this.dismissedUserIds.has(u.id));
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
          // Eliminar usuario seguido de la lista inmediatamente
          this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== user.id);
          setTimeout(() => this.loadSuggestions(), 300);
        },
        error: (error) => {
          console.error('Error al seguir:', error);
          this.isLoading[user.id] = false;
        }
      });
    }
  }

  dismissUser(user: FollowUser) {
    this.dismissedUserIds.add(user.id);
    this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== user.id);
  }

  getDisplayedUsers(): FollowUser[] {
    const filtered = this.suggestedUsers.filter(u => !this.dismissedUserIds.has(u.id));
    return this.showAll ? filtered : filtered.slice(0, 10);
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }

  getButtonText(user: FollowUser): string {
    if (user.isFollowing) return 'explore.suggested.following';
    if (user.isPendingRequest) return 'explore.suggested.pending';
    return 'explore.suggested.follow';
  }

  getDisplayName(user: FollowUser): string {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;
    if (user.name && user.name.trim()) return user.name.trim();
    return user.username;
  }
}
