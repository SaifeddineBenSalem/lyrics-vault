import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppToast {
  id: string;
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly toasts = signal<AppToast[]>([]);

  show(type: NotificationType, message: string): void {
    const toast: AppToast = { id: crypto.randomUUID(), type, message };
    const current = this.toasts();
    this.toasts.set([...current, toast]);

    window.setTimeout(() => {
      this.toasts.set(this.toasts().filter((item) => item.id !== toast.id));
    }, 3000);
  }

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  info(message: string): void {
    this.show('info', message);
  }
}
