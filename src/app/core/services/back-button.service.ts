import { Injectable } from '@angular/core';

export type BackButtonHandler = () => boolean; // true = "consumí el evento, no navegues"

@Injectable({ providedIn: 'root' })
export class BackButtonService {
  private handlers: BackButtonHandler[] = [];

  register(handler: BackButtonHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  handleBack(): boolean {
    if (this.handlers.length === 0) return false;
    const topHandler = this.handlers[this.handlers.length - 1];
    return topHandler();
  }
}
