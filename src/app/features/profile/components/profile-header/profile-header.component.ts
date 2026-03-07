import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserProfile } from '../../../../core/services/profile.service';
import { ChatService } from '../../../../core/services/chat.service';

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

  constructor(
    private router: Router,
    private chatService: ChatService
  ) {}

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

  onSendMessage(): void {
    if (!this.profile?.id) return;

    // Crear o buscar conversación con este usuario
    this.chatService.createConversation(this.profile.id).subscribe({
      next: (conversation) => {
        // Redirigir al chat con la conversación activa
        this.chatService.setActiveConversation(conversation);
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        console.error('Error al crear conversación:', error);
      }
    });
  }
}
