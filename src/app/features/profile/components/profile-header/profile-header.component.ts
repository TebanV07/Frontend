import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.scss'
})
export class ProfileHeaderComponent {
  @Input() profile!: UserProfile;
  @Input() isOwnProfile = true;
  @Input() isFollowing = false;
  
  @Output() onToggleFollow = new EventEmitter<void>();
  @Output() onEditProfile = new EventEmitter<void>();
  @Output() onShareProfile = new EventEmitter<void>();
  @Output() onOpenSettings = new EventEmitter<void>();

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getJoinedDate(): string {
    if (!this.profile?.joinedDate) return '';
    const date = new Date(this.profile.joinedDate);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  }
}