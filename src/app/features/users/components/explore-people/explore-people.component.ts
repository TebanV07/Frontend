import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  FollowService,
  FollowUser,
  ExploreCountryGroup,
} from '../../../../core/services/follow.service';
import { ChatService } from '../../../../core/services/chat.service';
import { SuggestedUserComponent } from '../suggested-user/suggested-user.component';
import { FollowRequestsComponent } from '../follow-requests/follow-requests.component';

@Component({
  selector: 'app-explore-people',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SuggestedUserComponent, FollowRequestsComponent, TranslateModule],
  templateUrl: './explore-people.component.html',
  styleUrl: './explore-people.component.scss'
})
export class ExplorePeopleComponent implements OnInit {
  searchQuery = '';
  searchResults: FollowUser[] = [];
  isSearching = false;
  hasSearched = false;

  isLoadingExplore = false;
  countryGroups: ExploreCountryGroup[] = [];
  availableCountries: Array<{ country_code: string; country_name: string; users_count: number }> = [];
  selectedCountry = 'ALL';

  actionLoading: { [key: string]: boolean } = {};
  actionFeedback = '';
  actionFeedbackType: 'success' | 'error' | '' = '';

  constructor(
    private followService: FollowService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.loadExploreCountries();
    this.loadExplorePeople();
  }

  onCountryChange() {
    const query = this.searchQuery.trim();
    this.loadExplorePeople(query || undefined);
  }

  onSearch() {
    const query = this.searchQuery.trim();

    if (!query) {
      this.searchResults = [];
      this.hasSearched = false;
      this.loadExplorePeople();
      return;
    }

    this.isSearching = true;
    this.hasSearched = true;

    this.followService.searchUsers(query, 20).subscribe({
      next: (users) => {
        this.searchResults = users;
        this.loadExplorePeople(query);
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.isSearching = false;
      }
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.hasSearched = false;
    this.loadExplorePeople();
  }

  loadExploreCountries() {
    this.followService.getExploreCountries().subscribe({
      next: (countries) => {
        this.availableCountries = countries;
      },
      error: (error) => {
        console.error('Error cargando países:', error);
      }
    });
  }

  loadExplorePeople(query?: string) {
    this.isLoadingExplore = true;

    this.followService
      .getExplorePeople(this.selectedCountry, 80, 12, query)
      .subscribe({
        next: (response) => {
          this.countryGroups = response.countries;
          this.isLoadingExplore = false;
        },
        error: (error) => {
          console.error('Error cargando explore people:', error);
          this.countryGroups = [];
          this.isLoadingExplore = false;
        },
      });
  }

  toggleFollow(user: FollowUser, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const actionKey = `follow-${user.id}`;
    if (this.actionLoading[actionKey]) return;

    this.actionLoading[actionKey] = true;
    const isConnected = Boolean(user.isFollowing || user.isPendingRequest);

    const request$ = isConnected
      ? this.followService.unfollowUser(user.id)
      : this.followService.followUser(user.id);

    request$.subscribe({
      next: (response: any) => {
        if (response?.error) {
          this.showFeedback(response.message || 'No se pudo completar la acción', 'error');
          this.actionLoading[actionKey] = false;
          return;
        }

        if (isConnected) {
          this.syncUserState(user.id, { isFollowing: false, isPendingRequest: false });
          this.showFeedback(response?.message || 'Conexión eliminada', 'success');
          this.actionLoading[actionKey] = false;
          return;
        }

        const isPending = Boolean(
          response?.is_pending_request ?? response?.isPendingRequest ?? response?.requires_approval
        );
        const isFollowing = !isPending && Boolean(response?.is_following ?? response?.isFollowing ?? true);

        this.syncUserState(user.id, {
          isFollowing,
          isPendingRequest: isPending,
        });

        this.showFeedback(
          isPending ? 'Solicitud de seguimiento enviada' : 'Ahora sigues a este usuario',
          'success'
        );

        this.actionLoading[actionKey] = false;
      },
      error: (error) => {
        console.error('Error en follow/unfollow:', error);
        this.showFeedback('No se pudo completar la acción', 'error');
        this.actionLoading[actionKey] = false;
      }
    });
  }

  requestConversation(user: FollowUser, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const actionKey = `talk-${user.id}`;
    if (this.actionLoading[actionKey]) return;

    this.actionLoading[actionKey] = true;

    this.chatService.requestConversation(user.id).subscribe({
      next: () => {
        this.showFeedback(`Solicitud para conversar enviada a @${user.username}`, 'success');
        this.actionLoading[actionKey] = false;
      },
      error: (error) => {
        console.error('Error solicitando conversación:', error);
        this.showFeedback('No se pudo enviar la solicitud para conversar', 'error');
        this.actionLoading[actionKey] = false;
      }
    });
  }

  getDisplayName(user: FollowUser): string {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;
    if (user.name && user.name.trim()) return user.name.trim();
    return user.username;
  }

  getFollowButtonText(user: FollowUser): string {
    if (user.isFollowing) return 'explore.suggested.following';
    if (user.isPendingRequest) return 'explore.suggested.pending';
    return 'explore.suggested.follow';
  }

  getCountryLabel(user: FollowUser): string {
    const code = (user.country_code || 'OT').toUpperCase();
    const country = this.availableCountries.find(c => c.country_code === code);
    return country?.country_name || code;
  }

  private syncUserState(
    userId: number,
    state: { isFollowing?: boolean; isPendingRequest?: boolean }
  ) {
    this.searchResults = this.searchResults.map((user) =>
      user.id === userId
        ? {
            ...user,
            isFollowing: state.isFollowing ?? user.isFollowing,
            isPendingRequest: state.isPendingRequest ?? user.isPendingRequest,
          }
        : user
    );

    this.countryGroups = this.countryGroups.map((group) => ({
      ...group,
      users: group.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              isFollowing: state.isFollowing ?? user.isFollowing,
              isPendingRequest: state.isPendingRequest ?? user.isPendingRequest,
            }
          : user
      ),
    }));
  }

  private showFeedback(message: string, type: 'success' | 'error') {
    this.actionFeedback = message;
    this.actionFeedbackType = type;

    setTimeout(() => {
      this.actionFeedback = '';
      this.actionFeedbackType = '';
    }, 2600);
  }
}


