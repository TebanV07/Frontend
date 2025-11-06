import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService, UserProfile } from '../../../../core/services/profile.service';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { ProfileTabsComponent } from '..//profile-tabs/profile-tabs.component';
import { ProfileContentComponent } from '../profile-content/profile-content.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileHeaderComponent,
    ProfileTabsComponent,
    ProfileContentComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  selectedTab: 'videos' | 'liked' | 'bookmarks' = 'videos';
  isOwnProfile = true;
  isFollowing = false;

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.profileService.getCurrentProfile().subscribe(profile => {
      this.profile = profile;
      this.isFollowing = profile?.isFollowing || false;
    });
  }

  toggleFollow() {
    if (this.profile) {
      this.profileService.toggleFollow(this.profile.id).subscribe(isFollowing => {
        this.isFollowing = isFollowing;
      });
    }
  }

  selectTab(tab: 'videos' | 'liked' | 'bookmarks') {
    this.selectedTab = tab;
  }

  editProfile() {
    console.log('Edit profile');
  }

  shareProfile() {
    console.log('Share profile');
  }

  openSettings() {
    console.log('Open settings');
  }
}