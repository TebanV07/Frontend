import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FollowService, FollowUser } from '../../../../core/services/follow.service';
import { SuggestedUserComponent } from '../suggested-user/suggested-user.component';
import { FollowRequestsComponent } from '../follow-requests/follow-requests.component';

@Component({
  selector: 'app-explore-people',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SuggestedUserComponent, FollowRequestsComponent],
  templateUrl: './explore-people.component.html',
  styleUrl: './explore-people.component.scss'
})
export class ExplorePeopleComponent implements OnInit {
  searchQuery = '';
  searchResults: FollowUser[] = [];
  isSearching = false;
  hasSearched = false;

  constructor(private followService: FollowService) {}

  ngOnInit() {}

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.hasSearched = false;
      return;
    }

    this.isSearching = true;
    this.hasSearched = true;

    // ⭐ MEJORADO: Usar searchUsers en lugar de getSuggestedUsers
    this.followService.searchUsers(this.searchQuery, 20).subscribe({
      next: (users) => {
        this.searchResults = users;
        console.log('✅ Resultados de búsqueda:', users);
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
  }
}
