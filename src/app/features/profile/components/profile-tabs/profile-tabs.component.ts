import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-tabs.component.html',
  styleUrl: './profile-tabs.component.scss'
})
export class ProfileTabsComponent {
  @Input() selectedTab: 'posts' | 'videos' | 'liked' | 'bookmarks' = 'posts';
  @Input() videosCount = 0;
  @Input() postsCount = 0;

  @Output() onSelectTab = new EventEmitter<'posts' | 'videos' | 'liked' | 'bookmarks'>();

  selectTab(tab: 'posts' | 'videos' | 'liked' | 'bookmarks') {
    this.onSelectTab.emit(tab);
  }
}
