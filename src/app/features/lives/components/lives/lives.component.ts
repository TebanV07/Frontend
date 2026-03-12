import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: Date;
}

interface Live {
  id: string;
  title: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  viewers: number;
  thumbnailUrl: string;
  category: string;
}

@Component({
  selector: 'app-lives',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, TranslateModule],
  templateUrl: './lives.component.html',
  styleUrls: ['./lives.component.scss']
})
export class LivesComponent implements OnInit {
  liveStreams: Live[] = [];
  selectedLive: Live | null = null;
  chatMessages: ChatMessage[] = [];
  newMessage = '';

  ngOnInit() {
    this.liveStreams = [
      {
        id: 'live1',
        title: 'Building AI Apps LIVE',
        user: { name: 'Alex Chen', username: '@alex', avatar: 'https://i.pravatar.cc/50?img=1' },
        viewers: 3420,
        thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
        category: 'Technology'
      },
      {
        id: 'live2',
        title: 'Cocinando en VIVO',
        user: { name: 'Maria Garcia', username: '@maria', avatar: 'https://i.pravatar.cc/50?img=2' },
        viewers: 2180,
        thumbnailUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=225&fit=crop',
        category: 'Food'
      },
      {
        id: 'live3',
        title: 'Morning Workout',
        user: { name: 'Marcus Johnson', username: '@marcus', avatar: 'https://i.pravatar.cc/50?img=3' },
        viewers: 5240,
        thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=225&fit=crop',
        category: 'Fitness'
      }
    ];

    if (this.liveStreams.length > 0) {
      this.selectedLive = this.liveStreams[0];
      this.chatMessages = [
        { id: '1', username: '@user1', avatar: 'https://i.pravatar.cc/50?img=4', message: 'Great stream!', timestamp: new Date() },
        { id: '2', username: '@user2', avatar: 'https://i.pravatar.cc/50?img=5', message: 'Love it!', timestamp: new Date() }
      ];
    }
  }

  selectLive(live: Live) {
    this.selectedLive = live;
    this.chatMessages = [];
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.chatMessages.push({
        id: Date.now().toString(),
        username: '@you',
        avatar: 'https://i.pravatar.cc/50?img=0',
        message: this.newMessage,
        timestamp: new Date()
      });
      this.newMessage = '';
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }
}

