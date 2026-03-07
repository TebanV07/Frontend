import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FollowService, FollowRequest } from '../../../../core/services/follow.service';

@Component({
  selector: 'app-follow-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './follow-requests.component.html',
  styleUrl: './follow-requests.component.scss'
})
export class FollowRequestsComponent implements OnInit {
  requests: FollowRequest[] = [];
  isProcessing: { [key: number]: boolean } = {};

  constructor(private followService: FollowService) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.followService.getFollowRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
      },
      error: (error) => {
        console.error('Error cargando solicitudes:', error);
      }
    });
  }

  acceptRequest(request: FollowRequest) {
    this.isProcessing[request.id] = true;

    this.followService.acceptFollowRequest(request.id).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r.id !== request.id);
        this.isProcessing[request.id] = false;
      },
      error: (error) => {
        console.error('Error al aceptar solicitud:', error);
        this.isProcessing[request.id] = false;
      }
    });
  }

  rejectRequest(request: FollowRequest) {
    this.isProcessing[request.id] = true;

    this.followService.rejectFollowRequest(request.id).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r.id !== request.id);
        this.isProcessing[request.id] = false;
      },
      error: (error) => {
        console.error('Error al rechazar solicitud:', error);
        this.isProcessing[request.id] = false;
      }
    });
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(diff / 604800000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return `Hace ${weeks}sem`;
  }
}
