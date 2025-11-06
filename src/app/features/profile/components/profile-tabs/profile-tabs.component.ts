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
  @Input() selectedTab: 'videos' | 'liked' | 'bookmarks' = 'videos';
  @Input() videosCount = 0;
  
  @Output() onSelectTab = new EventEmitter<'videos' | 'liked' | 'bookmarks'>();

  selectTab(tab: 'videos' | 'liked' | 'bookmarks') {
    this.onSelectTab.emit(tab);
  }
}