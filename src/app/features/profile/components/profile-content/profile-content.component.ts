import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-profile-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-content.component.html',
  styleUrl: './profile-content.component.scss'
})
export class ProfileContentComponent {
  @Input() profile!: UserProfile;
  @Input() selectedTab: 'videos' | 'liked' | 'bookmarks' = 'videos';

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  onVideoClick(videoId: string) {
    console.log('Video clicked:', videoId);
  }
}